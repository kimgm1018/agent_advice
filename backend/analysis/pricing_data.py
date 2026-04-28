PRICING_EFFECTIVE_DATE = "2026-04-28"
PRICING_CONFIDENCE_POLICY = "high_only"

API_MODELS = [
    {
        "name": "OpenAI GPT-5.4 mini API",
        "input_per_1m": 0.75,
        "cache_read_per_1m": 0.075,
        "cache_write_per_1m": 0.75,
        "output_per_1m": 4.5,
        "search_per_1k": 10.0,
        "runtime_per_hour": None,
        "deploy_per_run": None,
        "price_confidence": "high",
        "source": "https://platform.openai.com/docs/pricing",
    },
    {
        "name": "Anthropic Claude Sonnet 4.6 API",
        "input_per_1m": 3.0,
        "cache_read_per_1m": 0.3,
        "cache_write_per_1m": 3.75,
        "output_per_1m": 15.0,
        "search_per_1k": 10.0,
        "runtime_per_hour": 0.05,
        "deploy_per_run": None,
        "price_confidence": "high",
        "source": "https://docs.anthropic.com/en/about-claude/pricing",
    },
    {
        "name": "Anthropic Claude Haiku 4.5 API",
        "input_per_1m": 1.0,
        "cache_read_per_1m": 0.1,
        "cache_write_per_1m": 1.25,
        "output_per_1m": 5.0,
        "search_per_1k": 10.0,
        "runtime_per_hour": 0.05,
        "deploy_per_run": None,
        "price_confidence": "high",
        "source": "https://docs.anthropic.com/en/about-claude/pricing",
    },
    {
        "name": "Google Gemini 2.5 Flash Flex API",
        "input_per_1m": 0.15,
        "cache_read_per_1m": None,
        "cache_write_per_1m": None,
        "output_per_1m": 1.25,
        "search_per_1k": 35.0,
        "runtime_per_hour": None,
        "deploy_per_run": None,
        "price_confidence": "high",
        "source": "https://ai.google.dev/gemini-api/docs/pricing",
    },
    {
        "name": "Cohere Command R API",
        "input_per_1m": 0.15,
        "cache_read_per_1m": None,
        "cache_write_per_1m": None,
        "output_per_1m": 0.6,
        "search_per_1k": None,
        "runtime_per_hour": None,
        "deploy_per_run": None,
        "price_confidence": "high",
        "source": "https://docs.cohere.com/docs/how-does-cohere-pricing-work",
    },
]

SUBSCRIPTION_PLANS = [
    {
        "name": "Cursor Pro",
        "monthly_fee": 20.0,
        "description": "개인 개발자용 월 구독(월 결제 기준)",
        "price_confidence": "high",
        "source": "https://cursor.com/pricing",
    },
    {
        "name": "Claude Pro",
        "monthly_fee": 20.0,
        "description": "개인 사용자용 월 구독(월 결제 기준)",
        "price_confidence": "high",
        "source": "https://www.anthropic.com/pricing",
    },
    {
        "name": "ChatGPT Plus",
        "monthly_fee": 20.0,
        "description": "개인 사용자용 월 구독(월 결제 기준)",
        "price_confidence": "high",
        "source": "https://chatgpt.com/pricing",
    },
]

# 동적 가격/문의형/공개 단가 불충분 항목은 추천 엔진 계산에서 제외한다.
EXCLUDED_PRICING_ITEMS = [
    {"name": "Azure OpenAI", "reason": "리전/통화/계약별 동적 가격"},
    {"name": "Kakao managed LLM", "reason": "공개 관리형 토큰 단가 미확인"},
]
