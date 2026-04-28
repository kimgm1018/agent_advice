type LlmProjectAnalysis = {
  projectType: string;
  extractedFeatures: string[];
  tokenMin: number;
  tokenMax: number;
  complexityScore: number;
  rationale: string;
};

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const ANALYSIS_MODEL = "gpt-4.1-mini";

function buildPrompt(input: string) {
  return `
너는 소프트웨어 프로젝트 견적 분석가다.
사용자 설명을 읽고 프로젝트 성격과 개발 규모를 추정해라.

반드시 JSON만 출력하고, 아래 스키마를 준수해라:
{
  "projectType": "string",
  "extractedFeatures": ["string", "..."],
  "tokenMin": number,
  "tokenMax": number,
  "complexityScore": number,
  "rationale": "string"
}

제약:
- tokenMin, tokenMax는 정수이며 tokenMin < tokenMax
- complexityScore는 0~100 범위
- extractedFeatures는 3~8개
- rationale은 1~2문장 한국어
- 불확실성이 있으면 rationale에 가정 조건을 짧게 포함

사용자 입력:
"""${input}"""
`;
}

function normalizeAnalysis(raw: LlmProjectAnalysis): LlmProjectAnalysis {
  const tokenMin = Math.max(50_000, Math.round(raw.tokenMin));
  const tokenMax = Math.max(tokenMin + 50_000, Math.round(raw.tokenMax));
  const complexityScore = Math.max(0, Math.min(100, Number(raw.complexityScore)));
  const extractedFeatures = Array.from(new Set(raw.extractedFeatures.map((v) => v.trim()).filter(Boolean))).slice(0, 8);

  return {
    projectType: raw.projectType?.trim() || "General Software",
    extractedFeatures: extractedFeatures.length ? extractedFeatures : ["basic crud", "frontend", "backend"],
    tokenMin,
    tokenMax,
    complexityScore: Number(complexityScore.toFixed(1)),
    rationale: raw.rationale?.trim() || "요구사항 밀도와 일반적인 개발 반복 횟수를 기준으로 추정했습니다."
  };
}

export async function analyzeProjectWithLlm(input: string): Promise<LlmProjectAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다. .env.local에 키를 추가해주세요.");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: ANALYSIS_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "너는 소프트웨어 개발 견적을 위한 프로젝트 분석 전문가다."
        },
        {
          role: "user",
          content: buildPrompt(input)
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM 분석 호출 실패: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("LLM 응답에서 분석 내용을 찾지 못했습니다.");
  }

  let parsed: LlmProjectAnalysis;
  try {
    parsed = JSON.parse(content) as LlmProjectAnalysis;
  } catch {
    throw new Error("LLM 응답 JSON 파싱에 실패했습니다.");
  }

  return normalizeAnalysis(parsed);
}
