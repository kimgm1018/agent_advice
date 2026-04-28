import { AGENT_PROFILES } from "@/lib/agent-data";
import { API_MODELS, SUBSCRIPTION_PLANS } from "@/lib/pricing-data";
import { AgentRecommendation, ScoreBreakdown } from "@/types/analysis";

function calculateApiCost(tokenRange: [number, number], apiModelName: string) {
  const model = API_MODELS.find((item) => item.name === apiModelName);
  if (!model) return 999;

  const avgTotalTokens = (tokenRange[0] + tokenRange[1]) / 2;
  const inputTokens = avgTotalTokens * 0.65;
  const outputTokens = avgTotalTokens * 0.35;

  const inputCost = (inputTokens / 1_000_000) * model.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * model.outputPer1M;

  return Number((inputCost + outputCost).toFixed(2));
}

function calculateSubscriptionCost(subscriptionName: string) {
  const plan = SUBSCRIPTION_PLANS.find((item) => item.name === subscriptionName);
  return plan?.monthlyFee ?? 999;
}

function complexityFitScore(complexity: number, band: [number, number]) {
  const [min, max] = band;
  if (complexity >= min && complexity <= max) return 9.3;
  if (complexity < min) return Math.max(4.2, 9.3 - (min - complexity) * 0.09);
  return Math.max(4.2, 9.3 - (complexity - max) * 0.09);
}

function costPredictabilityScore(mode: "api" | "subscription" | "hybrid", monthlyCostUsd: number) {
  if (mode === "subscription") return 9.0;
  if (mode === "hybrid") return 7.8;
  return monthlyCostUsd <= 5 ? 8.4 : monthlyCostUsd <= 15 ? 7.6 : 6.8;
}

function costEfficiencyBonus(monthlyCostUsd: number) {
  return monthlyCostUsd <= 2 ? 1.2 : monthlyCostUsd <= 8 ? 0.8 : monthlyCostUsd <= 20 ? 0.3 : -0.2;
}

export function estimateAgentOverheadTokenRange(
  tokenRange: [number, number],
  mode: "api" | "subscription" | "hybrid",
  requirementsCount: number
): [number, number] {
  const orchestrationCycles = Math.max(2, Math.ceil(requirementsCount / 2));
  const overheadTokenMultiplier = mode === "api" ? 0.22 : mode === "hybrid" ? 0.3 : 0.14;
  return [
    Math.round(tokenRange[0] * overheadTokenMultiplier * orchestrationCycles * 0.15),
    Math.round(tokenRange[1] * overheadTokenMultiplier * orchestrationCycles * 0.15)
  ];
}

function confidenceFromScore(score: number): "low" | "medium" | "high" {
  if (score >= 8.3) return "high";
  if (score >= 7.1) return "medium";
  return "low";
}

export function estimateProjectComplexity(tokens: [number, number], featureCount: number) {
  const avgTokens = (tokens[0] + tokens[1]) / 2;
  const tokenComponent = Math.min(70, avgTokens / 25_000);
  const featureComponent = Math.min(30, featureCount * 4.5);
  return Number((tokenComponent + featureComponent).toFixed(1));
}

export function recommendAgents(params: {
  tokenRange: [number, number];
  complexityScore: number;
  extractedFeatures: string[];
  requirementsCount: number;
}): AgentRecommendation[] {
  const { tokenRange, complexityScore, extractedFeatures, requirementsCount } = params;

  const recommendations = AGENT_PROFILES.map((agent) => {
    const apiCost = agent.apiModelName ? calculateApiCost(tokenRange, agent.apiModelName) : 0;
    const subscriptionCost = agent.subscriptionName ? calculateSubscriptionCost(agent.subscriptionName) : 0;
    const overheadTokens = estimateAgentOverheadTokenRange(tokenRange, agent.mode, requirementsCount);
    const overheadApiCost = agent.apiModelName ? calculateApiCost(overheadTokens, agent.apiModelName) : 0;
    const baseBuildCostUsd = Number(apiCost.toFixed(2));
    const totalCostUsd = Number((baseBuildCostUsd + overheadApiCost + subscriptionCost).toFixed(2));
    const monthlyCostUsd = totalCostUsd;

    const breakdown: ScoreBreakdown = {
      deliveryFit: Number(complexityFitScore(complexityScore, agent.complexityBand).toFixed(1)),
      autonomy: agent.autonomy,
      contextHandling: agent.contextHandling,
      costPredictability: Number(costPredictabilityScore(agent.mode, monthlyCostUsd).toFixed(1))
    };

    const fitScore =
      breakdown.deliveryFit * 0.35 +
      breakdown.autonomy * 0.25 +
      breakdown.contextHandling * 0.2 +
      breakdown.costPredictability * 0.2 +
      costEfficiencyBonus(monthlyCostUsd);

    const roundedScore = Number(fitScore.toFixed(1));

    return {
      name: agent.name,
      mode: agent.mode,
      monthlyCostUsd,
      fitScore: roundedScore,
      confidence: confidenceFromScore(roundedScore),
      scoreBreakdown: breakdown,
      costBreakdown: {
        baseBuildCostUsd,
        agentOverheadCostUsd: Number(overheadApiCost.toFixed(2)),
        subscriptionCostUsd: subscriptionCost,
        totalCostUsd
      },
      reason: `복잡도 ${complexityScore}점 프로젝트에 대한 수행 적합도와 비용 안정성을 함께 반영`,
      evidence: [
        `복잡도 대응 범위: ${agent.complexityBand[0]}~${agent.complexityBand[1]}`,
        `강점: ${agent.strengths.slice(0, 2).join(", ")}`,
        `예상 총비용: $${monthlyCostUsd.toFixed(2)} (구현 API + Agent 오버헤드 API + 구독 합산)`,
        `추출 기능 수: ${extractedFeatures.length}, 요구사항 유닛 수: ${requirementsCount}`
      ]
    } satisfies AgentRecommendation;
  });

  return recommendations.sort((a, b) => {
    if (b.fitScore !== a.fitScore) return b.fitScore - a.fitScore;
    return a.monthlyCostUsd - b.monthlyCostUsd;
  });
}
