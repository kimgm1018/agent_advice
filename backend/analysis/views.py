from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .graph_service import analyze_project_with_langgraph
from .pricing_data import PRICING_EFFECTIVE_DATE
from .recommender_service import recommend_agents
from .serializers import AnalyzeRequestSerializer


class AnalyzeView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AnalyzeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        text: str = serializer.validated_data["text"].strip()

        try:
            analysis = analyze_project_with_langgraph(text)
            token_range = (int(analysis["tokenMin"]), int(analysis["tokenMax"]))
            recommendations = recommend_agents(
                token_range=token_range,
                complexity_score=float(analysis["complexityScore"]),
                extracted_features=list(analysis["extractedFeatures"]),
                requirements_count=len(analysis["requirements"]),
            )
            payload = {
                "tokens": [token_range[0], token_range[1]],
                "extractedFeatures": analysis["extractedFeatures"],
                "requirements": analysis["requirements"],
                "projectType": analysis["projectType"],
                "complexityScore": analysis["complexityScore"],
                "projectAnalysisRationale": analysis["rationale"],
                "pricingEffectiveDate": PRICING_EFFECTIVE_DATE,
                "recommendations": recommendations,
            }
            return Response(payload, status=status.HTTP_200_OK)
        except Exception as exc:  # noqa: BLE001
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
