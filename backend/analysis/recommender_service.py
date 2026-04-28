from typing import Any

from .agent_data import AGENT_PROFILES
from .pricing_data import API_MODELS, SUBSCRIPTION_PLANS


def _get_api_model(api_model_name: str) -> dict[str, Any] | None:
    model = next((item for item in API_MODELS if item["name"] == api_model_name), None)
    if not model:
        return None
    if model.get("price_confidence") != "high":
        return None
    return model


def _token_cost(
    model: dict[str, Any],
    uncached_input_tokens: float,
    cache_read_tokens: float,
    cache_write_tokens: float,
    output_tokens: float,
    search_calls: float = 0.0,
    runtime_hours: float = 0.0,
    deploy_runs: float = 0.0,
) -> float:
    # C_request = Tin_uncached*pin + Tin_cache_read*pcache_read + Tin_cache_write*pcache_write
    #            + Tout*pout + Nsearch*psearch + Hruntime*pruntime + Ndeploy*pdeploy
    input_cost = (uncached_input_tokens / 1_000_000) * float(model["input_per_1m"])
    output_cost = (output_tokens / 1_000_000) * float(model["output_per_1m"])
    cache_read_cost = 0.0
    cache_write_cost = 0.0
    search_cost = 0.0
    runtime_cost = 0.0
    deploy_cost = 0.0

    if model.get("cache_read_per_1m") is not None:
        cache_read_cost = (cache_read_tokens / 1_000_000) * float(model["cache_read_per_1m"])
    if model.get("cache_write_per_1m") is not None:
        cache_write_cost = (cache_write_tokens / 1_000_000) * float(model["cache_write_per_1m"])
    if model.get("search_per_1k") is not None:
        search_cost = (search_calls / 1_000) * float(model["search_per_1k"])
    if model.get("runtime_per_hour") is not None:
        runtime_cost = runtime_hours * float(model["runtime_per_hour"])
    if model.get("deploy_per_run") is not None:
        deploy_cost = deploy_runs * float(model["deploy_per_run"])

    return round(input_cost + cache_read_cost + cache_write_cost + output_cost + search_cost + runtime_cost + deploy_cost, 2)


def _calculate_api_cost(
    token_range: tuple[int, int],
    api_model_name: str,
    *,
    cache_hit_rate: float,
    cache_write_rate: float,
    search_calls: float,
    runtime_hours: float,
    deploy_runs: float,
) -> float:
    model = _get_api_model(api_model_name)
    if not model:
        return 999.0

    avg_total_tokens = (token_range[0] + token_range[1]) / 2
    input_tokens = avg_total_tokens * 0.7
    output_tokens = avg_total_tokens * 0.35
    input_tokens = input_tokens * 0.95  # 메시지 압축/요약 적용 가정

    uncached_input_tokens = input_tokens * (1 - cache_hit_rate)
    cache_read_tokens = input_tokens * cache_hit_rate
    cache_write_tokens = input_tokens * cache_write_rate

    return _token_cost(
        model,
        uncached_input_tokens=uncached_input_tokens,
        cache_read_tokens=cache_read_tokens,
        cache_write_tokens=cache_write_tokens,
        output_tokens=output_tokens,
        search_calls=search_calls,
        runtime_hours=runtime_hours,
        deploy_runs=deploy_runs,
    )


def _calculate_subscription_cost(name: str) -> float:
    plan = next((item for item in SUBSCRIPTION_PLANS if item["name"] == name), None)
    if plan and plan.get("price_confidence") != "high":
        return 999.0
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
    requirements: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    recommendations = []
    requirement_units = requirements or []

    # 토큰화/과금 규칙(보고서 수식 적용)
    # T_in^(n)=T_sys+T_memory+sum(turns)+T_retrieval+T_files
    base_requirement_input = sum(float(req.get("estimatedInputTokens", 0)) for req in requirement_units)
    base_requirement_output = sum(float(req.get("estimatedOutputTokens", 0)) for req in requirement_units)
    t_sys = 1200.0
    t_memory = 800.0
    t_retrieval = 500.0 * max(1, requirements_count // 2)
    t_files = 200.0 * requirements_count
    t_toolcall = base_requirement_input * 0.08
    t_toolresult = base_requirement_output * 0.12

    t_in_formula = t_sys + t_memory + base_requirement_input + t_toolcall + t_toolresult + t_retrieval + t_files

    for agent in AGENT_PROFILES:
        cache_hit_rate = 0.4 if agent["mode"] in {"subscription", "hybrid"} else 0.28
        cache_write_rate = 0.12
        search_calls = max(0.0, requirements_count * 0.18)
        runtime_hours = max(0.0, requirements_count * 0.04)
        deploy_runs = max(0.0, requirements_count * 0.15)

        # 수식 기반 입력 토큰을 기존 범위와 평균해 안정화
        formula_token_range = (max(50_000, int(t_in_formula * 0.85)), max(120_000, int(t_in_formula * 1.7)))
        blended_token_range = (
            int((token_range[0] + formula_token_range[0]) / 2),
            int((token_range[1] + formula_token_range[1]) / 2),
        )

        base_build_cost = (
            _calculate_api_cost(
                blended_token_range,
                agent["api_model_name"],
                cache_hit_rate=cache_hit_rate,
                cache_write_rate=cache_write_rate,
                search_calls=search_calls,
                runtime_hours=runtime_hours,
                deploy_runs=deploy_runs,
            )
            if agent.get("api_model_name")
            else 0.0
        )
        subscription_cost = _calculate_subscription_cost(agent["subscription_name"]) if agent.get("subscription_name") else 0.0
        overhead_tokens = _overhead_token_range(token_range, agent["mode"], requirements_count)
        overhead_cost = (
            _calculate_api_cost(
                overhead_tokens,
                agent["api_model_name"],
                cache_hit_rate=cache_hit_rate,
                cache_write_rate=cache_write_rate,
                search_calls=0.0,
                runtime_hours=runtime_hours * 0.4,
                deploy_runs=0.0,
            )
            if agent.get("api_model_name")
            else 0.0
        )
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
                    f"토큰식 입력 추정 T_in≈{int(t_in_formula):,}, 캐시 hit≈{int(cache_hit_rate*100)}%",
                ],
            }
        )

    return sorted(recommendations, key=lambda item: (-item["fitScore"], item["monthlyCostUsd"]))
