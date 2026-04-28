const FEATURE_KEYWORDS: Record<string, string[]> = {
  "auth/login": ["로그인", "회원가입", "인증", "oauth", "auth"],
  admin: ["관리자", "admin", "어드민"],
  llm: ["llm", "ai", "gpt", "챗봇", "추천"],
  payment: ["결제", "구독", "정산", "billing", "payment"],
  realtime: ["실시간", "채팅", "socket", "stream"],
  dashboard: ["대시보드", "리포트", "분석", "차트"]
};

const PROJECT_TYPES = [
  { type: "Web App", hints: ["웹", "web", "사이트", "서비스", "saas"] },
  { type: "Mobile App", hints: ["앱", "ios", "android", "react native", "flutter"] },
  { type: "Internal Tool", hints: ["사내", "운영", "백오피스", "admin"] },
  { type: "AI Product", hints: ["ai", "llm", "gpt", "추천", "생성"] }
];

export function extractFeatures(input: string): string[] {
  const text = input.toLowerCase();
  const features = Object.entries(FEATURE_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => text.includes(keyword)))
    .map(([feature]) => feature);

  return features.length > 0 ? features : ["basic crud"];
}

export function classifyProjectType(input: string): string {
  const text = input.toLowerCase();
  const matched =
    PROJECT_TYPES.find(({ hints }) => hints.some((hint) => text.includes(hint)))?.type ?? "General Software";
  return matched;
}

export function estimateTokenRange(input: string, features: string[]): [number, number] {
  const lengthScore = Math.min(input.length / 40, 10);
  const featureScore = features.length * 1.4;
  const base = 180_000;

  const min = Math.round(base + (lengthScore + featureScore) * 40_000);
  const max = Math.round(min * (2.1 + Math.min(featureScore * 0.08, 0.6)));

  return [min, max];
}
