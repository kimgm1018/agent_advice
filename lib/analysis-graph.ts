import { ChatOpenAI } from "@langchain/openai";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { z } from "zod";
import { RequirementUnit } from "@/types/analysis";

const ANALYSIS_MODEL = "gpt-4.1-mini";

const requirementSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  complexity: z.enum(["low", "medium", "high"])
});

const extractOutputSchema = z.object({
  projectType: z.string().min(1),
  extractedFeatures: z.array(z.string().min(1)).min(3).max(10),
  requirements: z.array(requirementSchema).min(3).max(12),
  assumptions: z.array(z.string().min(1)).min(1).max(6)
});

const estimateUnitSchema = z.object({
  name: z.string().min(1),
  estimatedInputTokens: z.number().int().nonnegative(),
  estimatedOutputTokens: z.number().int().nonnegative()
});

const estimateOutputSchema = z.object({
  units: z.array(estimateUnitSchema).min(3).max(12),
  uncertaintyFactor: z.number().min(1.05).max(2.5),
  rationale: z.string().min(1)
});

const AnalysisState = Annotation.Root({
  input: Annotation<string>(),
  projectType: Annotation<string>(),
  extractedFeatures: Annotation<string[]>(),
  requirements: Annotation<RequirementUnit[]>(),
  assumptions: Annotation<string[]>(),
  tokenMin: Annotation<number>(),
  tokenMax: Annotation<number>(),
  complexityScore: Annotation<number>(),
  rationale: Annotation<string>()
});

export function aggregateRequirementTokens(
  requirements: RequirementUnit[],
  uncertaintyFactor: number
): { tokenMin: number; tokenMax: number; complexityScore: number } {
  const totalInput = requirements.reduce((sum, req) => sum + req.estimatedInputTokens, 0);
  const totalOutput = requirements.reduce((sum, req) => sum + req.estimatedOutputTokens, 0);
  const baseTotal = totalInput + totalOutput;

  const tokenMin = Math.max(80_000, Math.round(baseTotal * 0.95));
  const tokenMax = Math.max(tokenMin + 50_000, Math.round(baseTotal * uncertaintyFactor));

  const complexityRaw =
    requirements.length * 5 +
    requirements.filter((r) => r.complexity === "high").length * 8 +
    requirements.filter((r) => r.complexity === "medium").length * 4 +
    tokenMax / 40_000;

  const complexityScore = Number(Math.max(10, Math.min(100, complexityRaw)).toFixed(1));
  return { tokenMin, tokenMax, complexityScore };
}

function getLlm() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다. .env.local에 키를 추가해주세요.");
  }

  return new ChatOpenAI({
    model: ANALYSIS_MODEL,
    temperature: 0.2,
    apiKey: process.env.OPENAI_API_KEY
  });
}

const extractRequirementsNode = async (state: typeof AnalysisState.State) => {
  const llm = getLlm().withStructuredOutput(extractOutputSchema);

  const result = await llm.invoke([
    [
      "system",
      "너는 소프트웨어 아키텍트다. 입력 문장을 구현 가능한 요구사항 유닛으로 분해하고, 추론 과정을 숨긴 채 결과만 구조적으로 반환해라."
    ],
    [
      "user",
      `다음 프로젝트 설명을 분석해라.\n\n${state.input}\n\n규칙:\n- requirements는 실제 구현 단위여야 한다 (예: 인증, 결제, 관리자, 배포, 모니터링)\n- extractedFeatures는 핵심 키워드\n- assumptions에는 불확실한 가정을 넣는다`
    ]
  ]);

  return {
    projectType: result.projectType.trim(),
    extractedFeatures: Array.from(new Set(result.extractedFeatures.map((f) => f.trim()))).slice(0, 10),
    requirements: result.requirements.map((r) => ({
      ...r,
      estimatedInputTokens: 0,
      estimatedOutputTokens: 0
    })),
    assumptions: result.assumptions
  };
};

const estimateTokensPerRequirementNode = async (state: typeof AnalysisState.State) => {
  const llm = getLlm().withStructuredOutput(estimateOutputSchema);
  const reqForPrompt = state.requirements.map((r) => ({ name: r.name, complexity: r.complexity, description: r.description }));

  const result = await llm.invoke([
    [
      "system",
      "너는 AI 코딩 비용 견적 전문가다. 각 요구사항 단위별 입력/출력 토큰 사용량을 현실적인 범위로 추정해라."
    ],
    [
      "user",
      `프로젝트 유형: ${state.projectType}\n요구사항: ${JSON.stringify(reqForPrompt)}\n\n규칙:\n- 각 유닛별 estimatedInputTokens, estimatedOutputTokens를 정수로 반환\n- 토큰은 구현/디버깅/리팩터링 반복을 반영\n- uncertaintyFactor는 1.05~2.5 사이`
    ]
  ]);

  const unitsMap = new Map(result.units.map((u) => [u.name, u]));

  const requirements = state.requirements.map((req) => {
    const unit = unitsMap.get(req.name);
    return {
      ...req,
      estimatedInputTokens: unit?.estimatedInputTokens ?? 25_000,
      estimatedOutputTokens: unit?.estimatedOutputTokens ?? 12_000
    };
  });

  return {
    requirements,
    rationale: result.rationale.trim(),
    tokenMax: result.uncertaintyFactor
  };
};

const integrateNode = async (state: typeof AnalysisState.State) => {
  const uncertaintyFactor = typeof state.tokenMax === "number" ? state.tokenMax : 1.45;
  const { tokenMin, tokenMax, complexityScore } = aggregateRequirementTokens(state.requirements, uncertaintyFactor);

  return {
    tokenMin,
    tokenMax,
    complexityScore,
    rationale: `${state.rationale} (가정: ${state.assumptions.slice(0, 2).join(", ")})`
  };
};

const workflow = new StateGraph(AnalysisState)
  .addNode("extractRequirements", extractRequirementsNode)
  .addNode("estimateTokensPerRequirement", estimateTokensPerRequirementNode)
  .addNode("integrate", integrateNode)
  .addEdge(START, "extractRequirements")
  .addEdge("extractRequirements", "estimateTokensPerRequirement")
  .addEdge("estimateTokensPerRequirement", "integrate")
  .addEdge("integrate", END)
  .compile();

export async function analyzeProjectWithLangGraph(input: string) {
  const result = await workflow.invoke({
    input
  });

  return {
    projectType: result.projectType || "General Software",
    extractedFeatures: result.extractedFeatures?.length ? result.extractedFeatures : ["frontend", "backend", "api"],
    requirements: result.requirements || [],
    tokenMin: result.tokenMin || 120_000,
    tokenMax: result.tokenMax || 260_000,
    complexityScore: result.complexityScore || 45,
    rationale: result.rationale || "요구사항 단위 토큰을 통합해 추정했습니다."
  };
}
