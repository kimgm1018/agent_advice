type AgentProfile = {
  name: string;
  mode: "api" | "subscription" | "hybrid";
  apiModelName?: string;
  subscriptionName?: string;
  strengths: string[];
  autonomy: number;
  contextHandling: number;
  reliability: number;
  complexityBand: [number, number];
};

export const AGENT_PROFILES: AgentProfile[] = [
  {
    name: "Cursor Agent",
    mode: "subscription",
    subscriptionName: "Cursor Pro",
    strengths: ["codebase 편집 루프", "멀티파일 리팩터링", "개발 워크플로우 자동화"],
    autonomy: 9.0,
    contextHandling: 8.2,
    reliability: 8.5,
    complexityBand: [45, 95]
  },
  {
    name: "Claude Code Agent",
    mode: "hybrid",
    subscriptionName: "Claude Pro",
    apiModelName: "Anthropic Claude Haiku 4.5 API",
    strengths: ["긴 문맥 분석", "설계/리뷰 중심 작업", "요구사항 정제"],
    autonomy: 8.6,
    contextHandling: 9.2,
    reliability: 8.4,
    complexityBand: [40, 95]
  },
  {
    name: "OpenAI API Agent Stack",
    mode: "api",
    apiModelName: "OpenAI GPT-4.1 mini API",
    strengths: ["함수 호출 중심 자동화", "툴 연계", "대량 요청 처리"],
    autonomy: 7.8,
    contextHandling: 7.6,
    reliability: 8.1,
    complexityBand: [30, 85]
  },
  {
    name: "Gemini API Agent Stack",
    mode: "api",
    apiModelName: "Google Gemini 2.5 Flash API",
    strengths: ["저비용 대량 처리", "빠른 응답", "고빈도 반복 작업"],
    autonomy: 7.2,
    contextHandling: 7.4,
    reliability: 7.8,
    complexityBand: [20, 75]
  },
  {
    name: "ChatGPT Plus Agent Workflow",
    mode: "subscription",
    subscriptionName: "ChatGPT Plus",
    strengths: ["아이디어-초안-구현 루프", "범용 작업", "학습 곡선 낮음"],
    autonomy: 7.6,
    contextHandling: 7.9,
    reliability: 8.0,
    complexityBand: [25, 80]
  }
];
