export type ApiModelPricing = {
  name: string;
  inputPer1M: number;
  outputPer1M: number;
  source: string;
};

export type SubscriptionPlanPricing = {
  name: string;
  monthlyFee: number;
  description: string;
  source: string;
};

export const PRICING_EFFECTIVE_DATE = "2026-04-28";

// Note: prices can change by region, tax, billing tier, and provider policy.
export const API_MODELS: ApiModelPricing[] = [
  {
    name: "OpenAI GPT-4.1 mini API",
    inputPer1M: 0.4,
    outputPer1M: 1.6,
    source: "https://platform.openai.com/docs/pricing"
  },
  {
    name: "Anthropic Claude Haiku 4.5 API",
    inputPer1M: 1.0,
    outputPer1M: 5.0,
    source: "https://docs.anthropic.com/en/about-claude/pricing"
  },
  {
    name: "Google Gemini 2.5 Flash API",
    inputPer1M: 0.3,
    outputPer1M: 2.5,
    source: "https://ai.google.dev/gemini-api/docs/pricing"
  }
];

export const SUBSCRIPTION_PLANS: SubscriptionPlanPricing[] = [
  {
    name: "Cursor Pro",
    monthlyFee: 20,
    description: "개인 개발자용 월 구독(월 결제 기준)",
    source: "https://cursor.com/pricing"
  },
  {
    name: "Claude Pro",
    monthlyFee: 20,
    description: "개인 사용자용 월 구독(월 결제 기준)",
    source: "https://www.anthropic.com/pricing"
  },
  {
    name: "ChatGPT Plus",
    monthlyFee: 20,
    description: "개인 사용자용 월 구독(월 결제 기준)",
    source: "https://chatgpt.com/pricing"
  }
];
