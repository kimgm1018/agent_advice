import os
from typing import Any

from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field
from typing_extensions import TypedDict


class RequirementExtractUnit(BaseModel):
    name: str
    description: str
    complexity: str = Field(pattern="^(low|medium|high)$")


class ExtractOutput(BaseModel):
    projectType: str
    extractedFeatures: list[str]
    requirements: list[RequirementExtractUnit]
    assumptions: list[str]


class RequirementEstimateUnit(BaseModel):
    name: str
    estimatedInputTokens: int
    estimatedOutputTokens: int


class EstimateOutput(BaseModel):
    units: list[RequirementEstimateUnit]
    uncertaintyFactor: float
    rationale: str


class GraphState(TypedDict, total=False):
    input: str
    project_type: str
    extracted_features: list[str]
    requirements: list[dict[str, Any]]
    assumptions: list[str]
    token_min: int
    token_max: int
    complexity_score: float
    rationale: str
    uncertainty_factor: float


def _llm() -> ChatOpenAI:
    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY가 설정되지 않았습니다. 프로젝트 루트 .env.local 또는 백엔드 환경변수에 설정해주세요.")
    return ChatOpenAI(model="gpt-4.1-mini", temperature=0.2)


def aggregate_requirement_tokens(requirements: list[dict[str, Any]], uncertainty_factor: float) -> tuple[int, int, float]:
    total_input = sum(int(req["estimatedInputTokens"]) for req in requirements)
    total_output = sum(int(req["estimatedOutputTokens"]) for req in requirements)
    base_total = total_input + total_output
    token_min = max(80_000, round(base_total * 0.95))
    token_max = max(token_min + 50_000, round(base_total * uncertainty_factor))

    high_count = len([req for req in requirements if req["complexity"] == "high"])
    medium_count = len([req for req in requirements if req["complexity"] == "medium"])
    complexity_raw = len(requirements) * 5 + high_count * 8 + medium_count * 4 + token_max / 40_000
    complexity_score = round(max(10, min(100, complexity_raw)), 1)
    return token_min, token_max, complexity_score


def extract_requirements_node(state: GraphState) -> GraphState:
    llm = _llm().with_structured_output(ExtractOutput)
    result = llm.invoke(
        [
            (
                "system",
                "너는 소프트웨어 아키텍트다. 입력 문장을 구현 가능한 요구사항 유닛으로 분해하고 결과만 구조적으로 반환해라.",
            ),
            (
                "user",
                f"프로젝트 설명: {state['input']}\n요구사항은 구현 단위로 분해하고 assumptions에 불확실한 가정을 넣어라.",
            ),
        ]
    )
    return {
        "project_type": result.projectType.strip(),
        "extracted_features": list(dict.fromkeys([feature.strip() for feature in result.extractedFeatures]))[:10],
        "requirements": [
            {
                "name": req.name,
                "description": req.description,
                "complexity": req.complexity,
                "estimatedInputTokens": 0,
                "estimatedOutputTokens": 0,
            }
            for req in result.requirements
        ],
        "assumptions": result.assumptions,
    }


def estimate_tokens_node(state: GraphState) -> GraphState:
    llm = _llm().with_structured_output(EstimateOutput)
    req_for_prompt = [
        {"name": req["name"], "description": req["description"], "complexity": req["complexity"]}
        for req in state["requirements"]
    ]

    result = llm.invoke(
        [
            ("system", "너는 AI 코딩 비용 견적 전문가다. 각 요구사항별 입력/출력 토큰을 추정해라."),
            (
                "user",
                f"프로젝트 유형: {state['project_type']}\n요구사항: {req_for_prompt}\n"
                "각 유닛별 estimatedInputTokens, estimatedOutputTokens를 정수로 반환해라.",
            ),
        ]
    )

    unit_map = {unit.name: unit for unit in result.units}
    updated_requirements = []
    for req in state["requirements"]:
        unit = unit_map.get(req["name"])
        updated_requirements.append(
            {
                **req,
                "estimatedInputTokens": int(unit.estimatedInputTokens if unit else 25_000),
                "estimatedOutputTokens": int(unit.estimatedOutputTokens if unit else 12_000),
            }
        )

    return {
        "requirements": updated_requirements,
        "uncertainty_factor": float(max(1.05, min(2.5, result.uncertaintyFactor))),
        "rationale": result.rationale.strip(),
    }


def integrate_node(state: GraphState) -> GraphState:
    token_min, token_max, complexity_score = aggregate_requirement_tokens(
        state["requirements"], state.get("uncertainty_factor", 1.45)
    )
    assumptions = ", ".join(state.get("assumptions", [])[:2]) or "기본 가정"
    rationale = f"{state.get('rationale', '요구사항 단위 토큰을 통합해 추정했습니다.')} (가정: {assumptions})"
    return {"token_min": token_min, "token_max": token_max, "complexity_score": complexity_score, "rationale": rationale}


def _build_graph():
    graph = StateGraph(GraphState)
    graph.add_node("extract_requirements", extract_requirements_node)
    graph.add_node("estimate_tokens", estimate_tokens_node)
    graph.add_node("integrate", integrate_node)
    graph.add_edge(START, "extract_requirements")
    graph.add_edge("extract_requirements", "estimate_tokens")
    graph.add_edge("estimate_tokens", "integrate")
    graph.add_edge("integrate", END)
    return graph.compile()


_WORKFLOW = _build_graph()


def analyze_project_with_langgraph(text: str) -> dict[str, Any]:
    result = _WORKFLOW.invoke({"input": text})
    return {
        "projectType": result.get("project_type", "General Software"),
        "extractedFeatures": result.get("extracted_features", ["frontend", "backend", "api"]),
        "requirements": result.get("requirements", []),
        "tokenMin": result.get("token_min", 120_000),
        "tokenMax": result.get("token_max", 260_000),
        "complexityScore": result.get("complexity_score", 45.0),
        "rationale": result.get("rationale", "요구사항 단위 토큰을 통합해 추정했습니다."),
    }
