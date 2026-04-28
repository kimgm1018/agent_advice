import { describe, expect, it } from "vitest";
import { estimateAgentOverheadTokenRange, recommendAgents } from "@/lib/agent-recommender";

describe("estimateAgentOverheadTokenRange", () => {
  it("요구사항 수가 늘면 오버헤드 토큰이 증가한다", () => {
    const small = estimateAgentOverheadTokenRange([200_000, 500_000], "api", 3);
    const large = estimateAgentOverheadTokenRange([200_000, 500_000], "api", 8);

    expect(large[0]).toBeGreaterThan(small[0]);
    expect(large[1]).toBeGreaterThan(small[1]);
  });
});

describe("recommendAgents", () => {
  it("추천 결과에 비용 분해(오버헤드 포함)가 포함된다", () => {
    const result = recommendAgents({
      tokenRange: [300_000, 900_000],
      complexityScore: 62,
      extractedFeatures: ["auth/login", "admin", "payment"],
      requirementsCount: 6
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].costBreakdown.totalCostUsd).toBeGreaterThanOrEqual(result[0].costBreakdown.baseBuildCostUsd);
  });
});
