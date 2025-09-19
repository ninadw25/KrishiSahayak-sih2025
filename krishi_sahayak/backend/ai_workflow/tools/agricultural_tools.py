#!/usr/bin/env python3
"""
Agricultural Tools - LangChain tools for the agricultural agent
"""

from langchain_core.tools import BaseTool
from typing import Any, Dict
import sys
from pathlib import Path
import pandas as pd
import requests
import os
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Add paths for imports
current_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(current_dir))

from schemas.agent_schema import *
from models.fertilizer_model import FertilizerRecommendationSystem

class CropRecommendationTool(BaseTool):
    """Tool for crop recommendations"""
    name: str = "crop_recommendation"
    description: str = "Get crop recommendations based on location, soil, and season"
    
    def _run(self, tool_input: CropRecommendationToolInput) -> CropRecommendationToolOutput:
        """Run crop recommendation"""
        logger.debug(f"🌾 Running crop recommendation for season: {tool_input.season}")
        
        try:
            # Simple rule-based crop recommendation
            # In production, this would use your ML model
            
            season_crops = {
                "kharif": ["rice", "cotton", "sugarcane", "maize"],
                "rabi": ["wheat", "barley", "mustard", "gram"],
                "summer": ["fodder", "vegetables", "fruits"]
            }
            
            recommended_crops = season_crops.get(tool_input.season.lower(), ["rice"])
            logger.debug(f"🌾 Available crops for {tool_input.season}: {recommended_crops}")
            
            # Simple soil-based filtering
            soil = tool_input.soil_properties
            logger.debug(f"🌱 Soil properties - pH: {soil.ph}, N: {soil.N}, P: {soil.P}, K: {soil.K}")
            
            if soil.ph < 6.0:
                recommended_crop = "rice"  # Acid-tolerant
                logger.debug("🌾 Selected rice for acidic soil")
            elif soil.ph > 8.0:
                recommended_crop = "wheat"  # Alkaline-tolerant
                logger.debug("🌾 Selected wheat for alkaline soil")
            else:
                recommended_crop = recommended_crops[0]
                logger.debug(f"🌾 Selected {recommended_crop} for neutral soil")
            
            result = CropRecommendationToolOutput(
                recommended_crop=recommended_crop,
                confidence=0.85,
                reasoning=f"Based on {tool_input.season} season and soil pH {soil.ph}, {recommended_crop} is recommended"
            )
            
            logger.debug(f"✅ Crop recommendation complete: {recommended_crop}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Crop recommendation failed: {str(e)}")
            return CropRecommendationToolOutput(
                recommended_crop="rice",
                confidence=0.5,
                reasoning=f"Error in recommendation: {str(e)}"
            )
    
    async def arun(self, tool_input: CropRecommendationToolInput) -> CropRecommendationToolOutput:
        return self._run(tool_input)

class FertilizerRecommendationTool(BaseTool):
    """Tool for fertilizer recommendations"""
    name: str = "fertilizer_recommendation"
    description: str = "Get fertilizer recommendations for specific crops and soil conditions"
    
    def __init__(self):
        super().__init__()
        self.fertilizer_system = None
    
    def _initialize_system(self):
        """Initialize fertilizer system if not already done"""
        if self.fertilizer_system is None:
            logger.debug("🧪 Initializing fertilizer recommendation system...")
            try:
                # Data directory is in the parent directory of backend
                backend_dir = current_dir.parent.parent  # Go up from app to backend to agricultural-ai-platform
                data_dir = backend_dir / "data" / "ML"
                csv_path = data_dir / "fertilizer_crop.csv"
                logger.debug(f"📁 Looking for data at: {csv_path}")
                
                if not csv_path.exists():
                    logger.warning(f"⚠️ Fertilizer data file not found at: {csv_path}")
                    return
                
                self.fertilizer_system = FertilizerRecommendationSystem(str(csv_path))
                crop_data = pd.read_csv(csv_path)
                logger.debug(f"📊 Loaded {len(crop_data)} rows of crop data")
                
                self.fertilizer_system.train_model(crop_data)
                logger.debug("✅ Fertilizer system initialized and trained successfully")
                
            except Exception as e:
                logger.error(f"❌ Error initializing fertilizer system: {e}")
                import traceback
                logger.error(f"❌ Traceback: {traceback.format_exc()}")
    
    def _run(self, tool_input: FertilizerRecommendationToolInput) -> FertilizerRecommendationToolOutput:
        """Run fertilizer recommendation"""
        try:
            self._initialize_system()
            
            if self.fertilizer_system:
                soil = tool_input.soil_properties
                fertilizer, dosage = self.fertilizer_system.recommend_fertilizer(
                    N=soil.N, P=soil.P, K=soil.K, ph=soil.ph, crop=tool_input.crop
                )
                
                current_soil = {'N': soil.N, 'P': soil.P, 'K': soil.K, 'ph': soil.ph}
                updated_soil_dict = self.fertilizer_system.update_soil_parameters(
                    current_soil, fertilizer, dosage
                )
                
                updated_soil = SoilProperties(
                    N=updated_soil_dict['N'],
                    P=updated_soil_dict['P'],
                    K=updated_soil_dict['K'],
                    ph=updated_soil_dict['ph']
                )
                
                return FertilizerRecommendationToolOutput(
                    fertilizer=fertilizer,
                    dosage=round(dosage, 2),
                    updated_soil=updated_soil,
                    reasoning=f"Based on soil analysis for {tool_input.crop}, {fertilizer} at {dosage}kg/ha is recommended"
                )
            else:
                # Fallback recommendation
                return FertilizerRecommendationToolOutput(
                    fertilizer="NPK 10-26-26",
                    dosage=100.0,
                    updated_soil=tool_input.soil_properties,
                    reasoning="Default recommendation due to system unavailability"
                )
                
        except Exception as e:
            return FertilizerRecommendationToolOutput(
                fertilizer="NPK 10-26-26",
                dosage=100.0,
                updated_soil=tool_input.soil_properties,
                reasoning=f"Error in recommendation: {str(e)}"
            )
    
    async def arun(self, tool_input: FertilizerRecommendationToolInput) -> FertilizerRecommendationToolOutput:
        return self._run(tool_input)

class SoilHealthTool(BaseTool):
    """Tool for soil health analysis"""
    name: str = "soil_health"
    description: str = "Analyze soil conditions and provide health recommendations"
    
    def _run(self, tool_input: SoilHealthToolInput) -> SoilHealthToolOutput:
        """Analyze soil health"""
        try:
            soil = tool_input.soil_properties
            recommendations = []
            
            # pH analysis
            if soil.ph < 6.0:
                health_status = "Acidic soil detected"
                recommendations.append("Apply lime to increase pH")
            elif soil.ph > 8.0:
                health_status = "Alkaline soil detected"
                recommendations.append("Apply sulfur or organic matter to reduce pH")
            else:
                health_status = "Good pH balance"
            
            # Nutrient analysis
            if soil.N < 40:
                recommendations.append("Low nitrogen - apply urea or organic compost")
            if soil.P < 25:
                recommendations.append("Low phosphorus - apply DAP or rock phosphate")
            if soil.K < 30:
                recommendations.append("Low potassium - apply muriate of potash")
            
            if not recommendations:
                recommendations.append("Soil health is good - maintain current practices")
            
            analysis = f"Soil Analysis: N={soil.N}, P={soil.P}, K={soil.K}, pH={soil.ph}. {health_status}."
            
            return SoilHealthToolOutput(
                health_status=health_status,
                recommendations=recommendations,
                analysis=analysis
            )
            
        except Exception as e:
            return SoilHealthToolOutput(
                health_status="Analysis error",
                recommendations=["Unable to analyze soil - please check input data"],
                analysis=f"Error: {str(e)}"
            )
    
    async def arun(self, tool_input: SoilHealthToolInput) -> SoilHealthToolOutput:
        return self._run(tool_input)

class WeatherTool(BaseTool):
    """Tool for weather information"""
    name: str = "weather"
    description: str = "Get weather information and agricultural advice"
    
    def _run(self, tool_input: WeatherToolInput) -> WeatherToolOutput:
        """Get weather information"""
        try:
            # In production, integrate with actual weather API
            # For now, return mock data
            
            return WeatherToolOutput(
                current_weather=f"Current weather in {tool_input.location}: 28°C, partly cloudy, humidity 65%",
                forecast="Next 7 days: Moderate temperatures (25-30°C), chance of light rain in 3 days",
                agricultural_advice="Good conditions for most crops. Consider irrigation if no rain in next week."
            )
            
        except Exception as e:
            return WeatherToolOutput(
                current_weather="Weather data unavailable",
                forecast="Forecast unavailable",
                agricultural_advice=f"Error getting weather data: {str(e)}"
            )
    
    async def arun(self, tool_input: WeatherToolInput) -> WeatherToolOutput:
        return self._run(tool_input)

class PriceTool(BaseTool):
    """Tool for crop price information"""
    name: str = "price"
    description: str = "Get crop prices and market trends"
    
    def _run(self, tool_input: PriceToolInput) -> PriceToolOutput:
        """Get price information"""
        try:
            # Try to read from price data CSV
            backend_dir = current_dir.parent.parent  # Go up from app to backend to agricultural-ai-platform
            price_data_dir = backend_dir / "data" / "price_data"
            
            # Mock price data for now
            crop_prices = {
                "rice": 2500,
                "wheat": 2200,
                "maize": 1800,
                "cotton": 5500,
                "sugarcane": 350
            }
            
            price = crop_prices.get(tool_input.crop.lower(), 2000)
            
            return PriceToolOutput(
                current_price=price,
                price_trend="Stable with slight upward trend",
                market_advice=f"Current {tool_input.crop} price is ₹{price}/quintal. Good time to sell if you have stock."
            )
            
        except Exception as e:
            return PriceToolOutput(
                current_price=0.0,
                price_trend="Data unavailable",
                market_advice=f"Error getting price data: {str(e)}"
            )
    
    async def arun(self, tool_input: PriceToolInput) -> PriceToolOutput:
        return self._run(tool_input)

class RAGTool(BaseTool):
    """Tool for RAG-based question answering"""
    name: str = "rag"
    description: str = "Answer questions about government schemes and general agricultural FAQs"
    
    def _run(self, tool_input: RAGToolInput) -> RAGToolOutput:
        """Answer using RAG context"""
        try:
            # Mock RAG responses for common questions
            faq_responses = {
                "irrigation": "Government provides subsidies up to 90% for drip irrigation systems under PMKSY scheme.",
                "loan": "Kisan Credit Card offers loans up to ₹3 lakh at 7% interest rate for agricultural activities.",
                "subsidy": "Various subsidies available: fertilizer subsidy, seed subsidy, equipment subsidy through different schemes.",
                "insurance": "Pradhan Mantri Fasal Bima Yojana provides crop insurance with premium as low as 2% for farmers."
            }
            
            query_lower = tool_input.query.lower()
            response = "I don't have specific information about that. Please contact your local agricultural office."
            
            for keyword, answer in faq_responses.items():
                if keyword in query_lower:
                    response = answer
                    break
            
            return RAGToolOutput(
                answer=response,
                sources=["Government Agricultural Portal", "PMKSY Guidelines"],
                confidence=0.8
            )
            
        except Exception as e:
            return RAGToolOutput(
                answer=f"Error processing query: {str(e)}",
                sources=[],
                confidence=0.0
            )
    
    async def arun(self, tool_input: RAGToolInput) -> RAGToolOutput:
        return self._run(tool_input)