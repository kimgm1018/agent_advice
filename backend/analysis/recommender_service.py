from typing import Any

from .agent_data import AGENT_PROFILES
from .pricing_data import API_MODELS, SUBSCRIPTION_PLANS


def _calculate_api_cost(token_range: tuple[int, int], api_model_name: str) -> float:
    model = next((item for item in API_MODELS if item["name"] == api_model_name), None)
    if not model:
        return 999.0
    avg_total_tokens = (token_range[0] + token_range[1]) / 2
    input_tokens = avg_total_tokens * 0.65
    output_tokens = avg_total_tokens * 0.35
    input_cost = (input_tokens / 1_000_000) * model["input_per_1m"]
    output_cost = (output_tokens / 1_000_000) * model["output_per_1m"]
    return round(input_cost + output_cost, 2)


def _calculate_subscription_cost(name: str) -> float:
    plan = next((item for item in SUBSCRIPTION_PLANS if item["name"] == name), None)
    return float(plan["monthly_fee"]) if plan else 999.0


def _complexity_fit_score(complexity: float, band: tuple[int, int]) -> float:
    min_score, max_score = band
    if min_score <= complexity <= max_score:
        return 9.3
    if complexity < min_score:
        return max(4.2, 9.3 - (min_score - complexity) * 0.09)
    return max(4.2, 9.3 - (complexity - max_score) * 0.09)


def _cost_predictability(mode: str, monthly_cost: float) -> float:
    if mode == "subscription":
        return 9.0
    if mode == "hybrid":
        return 7.8
    if monthly_cost <= 5:
        return 8.4
    if monthly_cost <= 15:
        return 7.6
    return 6.8


def _cost_efficiency_bonus(monthly_cost: float) -> float:
    if monthly_cost <= 2:
        return 1.2
    if monthly_cost <= 8:
        return 0.8
    if monthly_cost <= 20:
        return 0.3
    return -0.2


def _confidence(score: float) -> str:
    if score >= 8.3:
        return "high"
    if score >= 7.1:
        return "medium"
    return "low"


def _overhead_token_range(token_range: tuple[int, int], mode: str, requirements_count: int) -> tuple[int, int]:
    orchestration_cycles = max(2, -(-requirements_count // 2))
    overhead_multiplier = 0.22 if mode == "api" else 0.3 if mode == "hybrid" else 0.14
    return (
        round(token_range[0] * overhead_multiplier * orchestration_cycles * 0.15),
        round(token_range[1] * overhead_multiplier * orchestration_cycles * 0.15),
    )


def recommend_agents(
    token_range: tuple[int, int],
    complexity_score: float,
    extracted_features: list[str],
    requirements_count: int,
) -> list[dict[str, Any]]:
    recommendations = []
    for agent in AGENT_PROFILES:
        base_build_cost = _calculate_api_cost(token_range, agent["api_model_name"]) if agent.get("api_model_name") else 0.0
        subscription_cost = _calculate_subscription_cost(agent["subscription_name"]) if agent.get("subscription_name") else 0.0
        overhead_tokens = _overhead_token_range(token_range, agent["mode"], requirements_count)
        overhead_cost = _calculate_api_cost(overhead_tokens, agent["api_model_name"]) if agent.get("api_model_name") else 0.0
        total_cost = round(base_build_cost + overhead_cost + subscription_cost, 2)

        breakdown = {
            "deliveryFit": round(_complexity_fit_score(complexity_score, agent["complexity_band"]), 1),
            "autonomy": agent["autonomy"],
            "contextHandling": agent["context_handling"],
            "costPredictability": round(_cost_predictability(agent["mode"], total_cost), 1),
        }
        fit_score = round(
            breakdown["deliveryFit"] * 0.35
            + breakdown["autonomy"] * 0.25
            + breakdown["contextHandling"] * 0.2
            + breakdown["costPredictability"] * 0.2
            + _cost_efficiency_bonus(total_cost),
            1,
        )

        recommendations.append(
            {
                "name": agent["name"],
                "mode": agent["mode"],
                "monthlyCostUsd": total_cost,
                "fitScore": fit_score,
                "confidence": _confidence(fit_score),
                "scoreBreakdown": breakdown,
                "costBreakdown": {
                    "baseBuildCostUsd": round(base_build_cost, 2),
                    "agentOverheadCostUsd": round(overhead_cost, 2),
                    "subscriptionCostUsd": round(subscription_cost, 2),
                    "totalCostUsd": total_cost,
                },
                "reason": f"복잡도 {complexity_score}점 프로젝트에 대한 수행 적합도와 비용 안정성을 함께 반영",
                "evidence": [
                    f"복잡도 대응 범위: {agent['complexity_band'][0]}~{agent['complexity_band'][1]}",
                    f"강점: {', '.join(agent['strengths'][:2])}",
                    f"예상 총비용: ${total_cost:.2f} (구현 API + Agent 오버헤드 API + 구독 합산)",
                    f"추출 기능 수: {len(extracted_features)}, 요구사항 유닛 수: {requirements_count}",
                ],
            }
        )

    return sorted(recommendations, key=lambda item: (-item["fitScore"], item["monthlyCostUsd"]))
