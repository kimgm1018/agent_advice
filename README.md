# AI Coding Cost Recommender (MVP)

`mvp.md`를 기반으로 만든 Next.js + Django MVP입니다.

## 포함 기능

- 프로젝트 설명 입력
- 기능 추출 + 프로젝트 유형 분류
- 토큰 범위 추정
- API/구독형 요금제 비용 계산 (가격 기준일 표시)
- 상위 3개 추천 + 카드/차트 시각화

## 실행

### 1) Django 백엔드 실행

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

백엔드 환경변수(동일 터미널):

```bash
export OPENAI_API_KEY=sk-...
```

### 2) Next.js 프론트 실행

새 터미널에서:

```bash
cd /c/Users/kimgm/Desktop/agent_pjt
npm install
npm run dev
```

기본적으로 프론트는 `http://127.0.0.1:8000/api/analyze`를 호출합니다.
필요하면 `.env.local`에 아래를 설정하세요.

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## 분석 파이프라인 (2단계 + 통합)

- 1단계: 요구사항 분해 (프로젝트 성격, 기능, 구현 유닛 추출)
- 2단계: 요구사항 유닛별 토큰 추정 (입력/출력 토큰)
- 통합: 유닛 토큰 합산 + 불확실성 계수 반영으로 최종 토큰 범위/복잡도 계산
- 비용: 구현 API 비용 + Agent 오케스트레이션 추가 API 비용 + 구독 비용을 합산

## 테스트

프론트 로직 테스트:

```bash
npm run test
```

백엔드 테스트는 추후 `pytest` 기반으로 추가 가능합니다.

## API (Django)

- `POST http://127.0.0.1:8000/api/analyze`
- Request:

```json
{
  "text": "로그인, 관리자, 결제가 있는 AI 협업 SaaS를 만들고 싶어요."
}
```

- Response 예시:

```json
{
  "tokens": [320000, 910000],
  "extractedFeatures": ["인증", "결제", "관리자", "협업"],
  "requirements": [
    {
      "name": "OAuth 인증",
      "description": "로그인/회원가입 및 세션 관리",
      "complexity": "medium",
      "estimatedInputTokens": 70000,
      "estimatedOutputTokens": 32000
    }
  ],
  "projectType": "AI Product",
  "complexityScore": 63.4,
  "projectAnalysisRationale": "요구사항 유닛별 토큰을 합산하고 불확실성을 반영해 추정했습니다.",
  "pricingEffectiveDate": "2026-04-28",
  "recommendations": [
    {
      "name": "Cursor Agent",
      "mode": "subscription",
      "monthlyCostUsd": 20,
      "fitScore": 8.9
    }
  ]
}
```
