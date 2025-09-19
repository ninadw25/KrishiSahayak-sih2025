"""
Schemas package for Agricultural AI Platform
Contains all Pydantic models organized by feature
"""

from .fertilizer_schema import FertilizerInput, FertilizerOutput, SoilProperties
from .crop_schema import CropRecommenderInput, CropRecommenderOutput
from .agent_schema import (
    ChatInput, ChatOutput, AgentInput, AgentOutput,
    CropRecommendationToolInput, CropRecommendationToolOutput,
    FertilizerRecommendationToolInput, FertilizerRecommendationToolOutput,
    SoilHealthToolInput, SoilHealthToolOutput,
    WeatherToolInput, WeatherToolOutput,
    PriceToolInput, PriceToolOutput,
    RAGToolInput, RAGToolOutput
)

__all__ = [
    "FertilizerInput", "FertilizerOutput", "SoilProperties",
    "CropRecommenderInput", "CropRecommenderOutput",
    "ChatInput", "ChatOutput", "AgentInput", "AgentOutput",
    "CropRecommendationToolInput", "CropRecommendationToolOutput",
    "FertilizerRecommendationToolInput", "FertilizerRecommendationToolOutput",
    "SoilHealthToolInput", "SoilHealthToolOutput",
    "WeatherToolInput", "WeatherToolOutput",
    "PriceToolInput", "PriceToolOutput",
    "RAGToolInput", "RAGToolOutput"
]