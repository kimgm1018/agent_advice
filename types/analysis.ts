export type ProviderType = "api" | "subscription";

export interface ScoreBreakdown {
  deliveryFit: number;
  autonomy: number;
  contextHandling: number;
  costPredictability: number;
}

export interface CostBreakdown {
  baseBuildCostUsd: number;
  agentOverheadCostUsd: number;
  subscriptionCostUsd: number;
  totalCostUsd: number;
}

export interface AgentRecommendation {
  name: string;
  mode: ProviderType | "hybrid";
  monthlyCostUsd: number;
  fitScore: number;
  confidence: "low" | "medium" | "high";
  scoreBreakdown: ScoreBreakdown;
  costBreakdown: CostBreakdown;
  reason: string;
  evidence: string[];
}

export interface RequirementUnit {
  name: string;
  description: string;
  complexity: "low" | "medium" | "high";
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
}

export interface AnalyzeResponse {
  tokens: [number, number];
  extractedFeatures: string[];
  requirements: RequirementUnit[];
  projectType: string;
  complexityScore: number;
  projectAnalysisRationale: string;
  pricingEffectiveDate: string;
  recommendations: AgentRecommendation[];
}
