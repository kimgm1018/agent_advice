PRICING_EFFECTIVE_DATE = "2026-04-28"

API_MODELS = [
    {
        "name": "OpenAI GPT-4.1 mini API",
        "input_per_1m": 0.4,
        "output_per_1m": 1.6,
        "source": "https://platform.openai.com/docs/pricing",
    },
    {
        "name": "Anthropic Claude Haiku 4.5 API",
        "input_per_1m": 1.0,
        "output_per_1m": 5.0,
        "source": "https://docs.anthropic.com/en/about-claude/pricing",
    },
    {
        "name": "Google Gemini 2.5 Flash API",
        "input_per_1m": 0.3,
        "output_per_1m": 2.5,
        "source": "https://ai.google.dev/gemini-api/docs/pricing",
    },
]

SUBSCRIPTION_PLANS = [
    {
        "name": "Cursor Pro",
        "monthly_fee": 20.0,
        "description": "개인 개발자용 월 구독(월 결제 기준)",
        "source": "https://cursor.com/pricing",
    },
    {
        "name": "Claude Pro",
        "monthly_fee": 20.0,
        "description": "개인 사용자용 월 구독(월 결제 기준)",
        "source": "https://www.anthropic.com/pricing",
    },
    {
        "name": "ChatGPT Plus",
        "monthly_fee": 20.0,
        "description": "개인 사용자용 월 구독(월 결제 기준)",
        "source": "https://chatgpt.com/pricing",
    },
]
