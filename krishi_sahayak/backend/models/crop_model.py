#!/usr/bin/env python3
"""
Simplified Crop Recommendation Model
Core prediction logic for crop recommendations based on environmental conditions
"""

from dataclasses import dataclass
from typing import List, Optional

@dataclass
class CropPrediction:
    """Data model for crop prediction results"""
    crop: str
    suitability_score: float
    confidence: float
    predicted_yield_t_per_ha: float
    profit_estimate: Optional[int]
    fertilizer: str
    risks: List[str]
    reasoning: str

class CropRecommendationModel:
    """Simplified crop recommendation model"""
    
    def __init__(self):
        # Crop rules with optimal growing conditions
        self.crop_rules = {
            'rice': {
                'temp_range': (20, 35),
                'humidity_min': 60,
                'ph_range': (5.5, 7.0),
                'moisture_range': (30, 70),
                'season': ['kharif'],
                'base_score': 0.80
            },
            'wheat': {
                'temp_range': (15, 25),
                'humidity_min': 40,
                'ph_range': (6.0, 7.5),
                'moisture_range': (15, 40),
                'season': ['rabi'],
                'base_score': 0.70
            },
            'maize': {
                'temp_range': (18, 32),
                'humidity_min': 50,
                'ph_range': (6.0, 7.0),
                'moisture_range': (20, 50),
                'season': ['kharif', 'rabi'],
                'base_score': 0.60
            },
            'cotton': {
                'temp_range': (20, 35),
                'humidity_min': 40,
                'ph_range': (5.8, 8.0),
                'moisture_range': (10, 30),
                'season': ['kharif'],
                'base_score': 0.50
            },
            'sugarcane': {
                'temp_range': (20, 35),
                'humidity_min': 70,
                'ph_range': (6.0, 7.5),
                'moisture_range': (40, 80),
                'season': ['kharif'],
                'base_score': 0.60
            }
        }
        
        # Base yields (tons per hectare)
        self.base_yields = {
            'rice': 4.5,
            'wheat': 3.2,
            'maize': 5.8,
            'cotton': 1.8,
            'sugarcane': 75.0
        }
        
        # Base investment costs (INR per hectare)
        self.base_investments = {
            'rice': 45000,
            'wheat': 35000,
            'maize': 40000,
            'cotton': 50000,
            'sugarcane': 80000
        }
    
    def predict(self, temperature: float, humidity: float, soil_ph: float, 
                soil_moisture: float, season: str) -> List[CropPrediction]:
        """
        Predict crop suitability based on environmental conditions
        
        Args:
            temperature: Temperature in Celsius
            humidity: Humidity percentage (0-100)
            soil_ph: Soil pH level (0-14)
            soil_moisture: Soil moisture percentage (0-100)
            season: Growing season (kharif/rabi/zaid)
            
        Returns:
            List of crop predictions sorted by suitability score
        """
        predictions = []
        
        for crop, rule in self.crop_rules.items():
            score = rule['base_score']
            
            # Temperature score
            tmin, tmax = rule['temp_range']
            if tmin <= temperature <= tmax:
                score += 0.10
            elif abs(temperature - tmin) <= 5 or abs(temperature - tmax) <= 5:
                score += 0.05
            else:
                score -= 0.10
            
            # Humidity score
            if humidity >= rule['humidity_min']:
                score += 0.05
            
            # pH score
            phmin, phmax = rule['ph_range']
            if phmin <= soil_ph <= phmax:
                score += 0.10
            else:
                score -= 0.05
            
            # Moisture score
            mmin, mmax = rule['moisture_range']
            if mmin <= soil_moisture <= mmax:
                score += 0.10
            else:
                score -= 0.05
            
            # Season score
            if season.lower() in [s.lower() for s in rule['season']]:
                score += 0.10
            
            # Clamp score between 0 and 1
            score = max(0.0, min(1.0, score))
            
            # Calculate yield with modifiers
            yield_t = self.base_yields.get(crop, 3.0)
            if 25 <= soil_moisture <= 45:
                yield_t *= 1.10  # Optimal moisture bonus
            if 6.0 <= soil_ph <= 7.5:
                yield_t *= 1.05  # Optimal pH bonus
            yield_t = round(yield_t, 2)
            
            # Calculate risks
            risks = []
            if soil_moisture < mmin:
                risks.append("Drought risk - irrigation needed")
            if soil_moisture > mmax:
                risks.append("Waterlogging risk")
            if not (phmin <= soil_ph <= phmax):
                risks.append("Soil pH sub-optimal")
            if temperature < tmin or temperature > tmax:
                risks.append("Temperature stress possible")
            
            # Create prediction
            prediction = CropPrediction(
                crop=crop.title(),
                suitability_score=round(score, 3),
                confidence=round(score * 100, 1),
                predicted_yield_t_per_ha=yield_t,
                profit_estimate=int(self.base_investments.get(crop, 40000) * 1.5),
                fertilizer=f"NPK recommended for {crop}",
                risks=risks,
                reasoning=f"Score based on temp({temperature}°C), humidity({humidity}%), pH({soil_ph}), moisture({soil_moisture}%)"
            )
            
            predictions.append(prediction)
        
        # Sort by suitability score (highest first)
        predictions.sort(key=lambda x: x.suitability_score, reverse=True)
        return predictions

# Global model instance for easy import
crop_model = CropRecommendationModel()

def get_crop_recommendations(temperature: float, humidity: float, soil_ph: float, 
                           soil_moisture: float, season: str) -> List[CropPrediction]:
    """
    Simple function to get crop recommendations
    
    Args:
        temperature: Temperature in Celsius
        humidity: Humidity percentage
        soil_ph: Soil pH level
        soil_moisture: Soil moisture percentage
        season: Growing season
        
    Returns:
        List of crop predictions
    """
    return crop_model.predict(temperature, humidity, soil_ph, soil_moisture, season)

if __name__ == "__main__":
    # Simple test
    print("Testing crop recommendation model...")
    
    # Test with sample data
    temp = 25.0
    humidity = 65.0
    ph = 6.5
    moisture = 40.0
    season = "rabi"
    
    recommendations = get_crop_recommendations(temp, humidity, ph, moisture, season)
    
    print(f"\nCrop recommendations for:")
    print(f"Temperature: {temp}°C")
    print(f"Humidity: {humidity}%")
    print(f"Soil pH: {ph}")
    print(f"Soil moisture: {moisture}%")
    print(f"Season: {season}")
    print("\nRecommendations:")
    
    for i, rec in enumerate(recommendations[:3], 1):
        print(f"{i}. {rec.crop} (Score: {rec.suitability_score:.3f})")
        print(f"   Yield: {rec.predicted_yield_t_per_ha} t/ha")
        print(f"   Risks: {', '.join(rec.risks) if rec.risks else 'None'}")
        print()
