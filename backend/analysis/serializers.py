from rest_framework import serializers


class AnalyzeRequestSerializer(serializers.Serializer):
    text = serializers.CharField(min_length=2, max_length=5000)
