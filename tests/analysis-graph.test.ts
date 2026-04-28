import { describe, expect, it } from "vitest";
import { aggregateRequirementTokens } from "@/lib/analysis-graph";

describe("aggregateRequirementTokens", () => {
  it("요구사항 유닛 토큰을 통합해서 min/max를 계산한다", () => {
    const result = aggregateRequirementTokens(
      [
        {
          name: "인증",
          description: "OAuth 로그인",
          complexity: "medium",
          estimatedInputTokens: 60_000,
          estimatedOutputTokens: 30_000
        },
        {
          name: "결제",
          description: "정기결제 및 실패 재시도",
          complexity: "high",
          estimatedInputTokens: 90_000,
          estimatedOutputTokens: 45_000
        }
      ],
      1.5
    );

    expect(result.tokenMin).toBeGreaterThan(80_000);
    expect(result.tokenMax).toBeGreaterThan(result.tokenMin);
    expect(result.complexityScore).toBeGreaterThan(10);
  });
});
