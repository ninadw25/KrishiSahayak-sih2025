#!/usr/bin/env python3
"""
Agent Schemas - Pydantic models for agentic AI workflow
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from .fertilizer_schema import SoilProperties

class ChatRequest(BaseModel):
    """Enhanced input for chatbot - message with optional history and timestamp"""
    message: str
    chat_history: Optional[List[Dict[str, str]]] = []
    timestamp: Optional[str] = None

class ChatResponse(BaseModel):
    """Enhanced output for chatbot - response with metadata"""
    success: bool
    message: str
    response: str
    sources: Optional[List[str]] = []
    timestamp: Optional[str] = None

class AgentInput(BaseModel):
    """Internal input for the agricultural agent"""
    message: str
    session_id: str
    context: Optional[Dict[str, Any]] = None

class AgentOutput(BaseModel):
    """Internal output from the agricultural agent"""
    response: str
    tools_used: List[str]
    recommendations: Optional[Dict[str, Any]] = None
    session_id: str

# Tool-specific schemas
class CropRecommendationToolInput(BaseModel):
    """Input for crop recommendation tool"""
    state: str
    district: str
    prev_crop: str
    land_size: float
    season: str
    soil_properties: SoilProperties

class CropRecommendationToolOutput(BaseModel):
    """Output from crop recommendation tool"""
    recommended_crop: str
    confidence: float
    reasoning: Optional[str] = None

class FertilizerRecommendationToolInput(BaseModel):
    """Input for fertilizer recommendation tool"""
    crop: str
    soil_properties: SoilProperties

class FertilizerRecommendationToolOutput(BaseModel):
    """Output from fertilizer recommendation tool"""
    fertilizer: str
    dosage: float
    updated_soil: SoilProperties
    reasoning: Optional[str] = None

class SoilHealthToolInput(BaseModel):
    """Input for soil health analysis tool"""
    soil_properties: SoilProperties
    crop: Optional[str] = None
    fertiliser: Optional[str] = None

class SoilHealthToolOutput(BaseModel):
    """Output from soil health analysis tool"""
    health_status: str
    recommendations: List[str]
    analysis: str

class WeatherToolInput(BaseModel):
    """Input for weather tool"""
    location: str

class WeatherToolOutput(BaseModel):
    """Output from weather tool"""
    current_weather: str
    forecast: str
    agricultural_advice: str

class PriceToolInput(BaseModel):
    """Input for price tool"""
    crop: str
    location: Optional[str] = None

class PriceToolOutput(BaseModel):
    """Output from price tool"""
    current_price: float
    price_trend: str
    market_advice: str

class RAGToolInput(BaseModel):
    """Input for RAG context tool"""
    query: str
    context_type: str  # "govt_schemes", "general_faq", etc.

class RAGToolOutput(BaseModel):
    """Output from RAG context tool"""
    answer: str
    sources: List[str]
    confidence: float