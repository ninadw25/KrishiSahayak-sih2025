#!/usr/bin/env python3
"""
LOCAL ONLY Crop Recommendation Engine
No MongoDB, No Database, No Complexity - Just CSV Files + APIs
"""

import pandas as pd
import numpy as np
import json
import logging
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict
from fuzzywuzzy import fuzz, process
import requests
from pathlib import Path
import os
from dotenv import load_dotenv
import warnings
warnings.filterwarnings('ignore')

# Load environment variables
load_dotenv()

# Configuration
@dataclass
class Config:
    # API Keys
    RAPIDAPI_WEATHER_KEY: str = os.getenv('RAPIDAPI_WEATHER_KEY')
    MAPBOX_ACCESS_TOKEN: str = os.getenv('MAPBOX_ACCESS_TOKEN')
    
    # LOCAL CSV Files Only
    CSV_STATE_CROP_PATH: str = "data/comprehensive_state_crop_mapping.csv"
    CSV_DISTRICT_SOIL_PATH: str = "data/ultra_comprehensive_district_soil_mapping.csv"
    
    # API endpoints
    RAPIDAPI_WEATHER_BASE: str = "https://open-weather13.p.rapidapi.com"
    MAPBOX_GEOCODING_BASE: str = "https://api.mapbox.com/search/geocode/v6/forward"
    
    MIN_FUZZY_SCORE: int = 80
    MODEL_VERSION: str = "v2.0"

# Initialize logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Data Models
@dataclass
class Location:
    state: str
    district: str = ""
    latitude: float = 0.0
    longitude: float = 0.0

@dataclass
class SoilData:
    ph_level: float
    organic_matter_percent: float
    nitrogen_level: str
    phosphorus_level: str  
    potassium_level: str
    moisture_percent: float = 0.0
    primary_soil_type: str = ""
    drainage: str = ""
    texture: str = ""

@dataclass
class WeatherData:
    temperature: float
    humidity: float
    rainfall_mm: float
    season: str
    wind_speed: float = 0.0
    pressure: float = 1013.0

@dataclass
class CropRecommendation:
    crop_name: str
    suitability_score: float
    confidence: float
    reasoning: str
    risk_factors: List[str]
    expected_yield_tons_per_hectare: float = 0.0
    investment_required_per_hectare: float = 0.0
    profit_potential: str = "Unknown"
    growing_period_days: int = 120
    irrigation_requirements: str = "Moderate"
    fertilizer_recommendations: str = "Standard NPK"

# LOCAL Data Manager - NO DATABASE!
class LocalDataManager:
    def __init__(self):
        self.state_crop_df = None
        self.district_soil_df = None
        self.load_data()
    
    def load_data(self):
        """Load CSV files locally"""
        try:
            if Path(Config.CSV_STATE_CROP_PATH).exists():
                self.state_crop_df = pd.read_csv(Config.CSV_STATE_CROP_PATH)
                logger.info(f"✅ Loaded {len(self.state_crop_df)} state-crop records")
            
            if Path(Config.CSV_DISTRICT_SOIL_PATH).exists():
                self.district_soil_df = pd.read_csv(Config.CSV_DISTRICT_SOIL_PATH)
                logger.info(f"✅ Loaded {len(self.district_soil_df)} soil records")
                
            logger.info("🎉 ALL DATA LOADED LOCALLY - NO DATABASE!")
        except Exception as e:
            logger.error(f"❌ Error loading data: {e}")
    
    def get_crops_by_state(self, state: str) -> List[str]:
        """Get crops for state"""
        if self.state_crop_df is None:
            return []
        
        state_data = self.state_crop_df[
            self.state_crop_df['state'].str.contains(state, case=False, na=False)
        ]
        return state_data['crop'].unique().tolist()
    
    def get_soil_data(self, state: str, district: str) -> Optional[Dict]:
        """Get soil data"""
        if self.district_soil_df is None:
            return None
        
        soil_data = self.district_soil_df[
            (self.district_soil_df['state'].str.contains(state, case=False, na=False)) &
            (self.district_soil_df['district'].str.contains(district, case=False, na=False))
        ]
        
        if soil_data.empty:
            soil_data = self.district_soil_df[
                self.district_soil_df['state'].str.contains(state, case=False, na=False)
            ]
        
        if not soil_data.empty:
            return soil_data.iloc[0].to_dict()
        return None

# Location Matcher
class LocationMatcher:
    def __init__(self, data_manager: LocalDataManager):
        self.data_manager = data_manager
        self.states = []
        self.districts = []
        self.load_locations()

    def load_locations(self):
        """Load locations from CSV"""
        try:
            if self.data_manager.state_crop_df is not None:
                self.states = self.data_manager.state_crop_df['state'].unique().tolist()
            
            if self.data_manager.district_soil_df is not None:
                self.districts = self.data_manager.district_soil_df['district'].unique().tolist()
            
            logger.info(f"📍 Loaded {len(self.states)} states and {len(self.districts)} districts")
        except Exception as e:
            logger.error(f"❌ Error loading locations: {e}")

    def fuzzy_match_location(self, user_input: str) -> Location:
        """Match location using fuzzy search"""
        user_input = user_input.strip()
        parts = [p.strip() for p in user_input.split(',')]
        
        if len(parts) >= 2:
            district_query, state_query = parts[0], parts[1]
        else:
            district_query = state_query = parts[0]
        
        # Match state
        state_match = process.extractOne(state_query, self.states, score_cutoff=Config.MIN_FUZZY_SCORE)
        matched_state = state_match[0] if state_match else state_query
        
        # Match district
        district_match = process.extractOne(district_query, self.districts, score_cutoff=Config.MIN_FUZZY_SCORE)
        matched_district = district_match[0] if district_match else district_query
        
        return Location(state=matched_state, district=matched_district)

# Weather Service with RapidAPI
class WeatherService:
    def __init__(self, api_key: str, mapbox_token: str):
        self.api_key = api_key
        self.mapbox_token = mapbox_token

    def get_weather_data(self, location: Location) -> WeatherData:
        """Get weather data"""
        if not self.api_key:
            return self._mock_weather_data()
            
        try:
            coords = self.get_coordinates(location)
            if not coords:
                return self._mock_weather_data()
                
            latitude, longitude = coords
            
            url = f"{Config.RAPIDAPI_WEATHER_BASE}/fivedaysforcast"
            params = {'latitude': latitude, 'longitude': longitude, 'lang': 'EN'}
            headers = {
                'x-rapidapi-host': 'open-weather13.p.rapidapi.com',
                'x-rapidapi-key': self.api_key
            }
            
            response = requests.get(url, params=params, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                current = data.get('list', [{}])[0] if data.get('list') else {}
                main = current.get('main', {})
                wind = current.get('wind', {})
                
                temp = main.get('temp', 298.15)
                if temp > 100:  # Convert Kelvin to Celsius
                    temp = temp - 273.15
                
                logger.info("✅ Got live weather from RapidAPI")
                return WeatherData(
                    temperature=round(temp, 1),
                    humidity=float(main.get('humidity', 60.0)),
                    rainfall_mm=float(current.get('rain', {}).get('1h', 0) * 30),
                    season=self.determine_season(),
                    wind_speed=float(wind.get('speed', 0)),
                    pressure=float(main.get('pressure', 1013))
                )
            else:
                logger.warning(f"⚠️ RapidAPI failed: {response.status_code}")
                return self._mock_weather_data()
            
        except Exception as e:
            logger.error(f"❌ Weather API error: {e}")
            return self._mock_weather_data()

    def get_coordinates(self, location: Location) -> Optional[Tuple[float, float]]:
        """Get coordinates with backup options"""
        
        # Try Mapbox first
        if self.mapbox_token:
            try:
                query = f"{location.district}, {location.state}, India"
                url = Config.MAPBOX_GEOCODING_BASE
                params = {'q': query, 'access_token': self.mapbox_token}
                
                response = requests.get(url, params=params, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    features = data.get('features', [])
                    if features:
                        coords = features[0]['geometry']['coordinates']
                        logger.info("✅ Got coordinates from Mapbox")
                        return (coords[1], coords[0])
            except Exception as e:
                logger.warning(f"⚠️ Mapbox failed: {e}")
        
        # Backup free geocoding
        try:
            query = f"{location.district}, {location.state}, India"
            url = "https://nominatim.openstreetmap.org/search"
            params = {'q': query, 'format': 'json', 'limit': 1}
            headers = {'User-Agent': 'CropRecommendationSystem/1.0'}
            
            response = requests.get(url, params=params, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data:
                    logger.info("✅ Got coordinates from backup geocoding")
                    return (float(data[0]['lat']), float(data[0]['lon']))
        except Exception as e:
            logger.warning(f"⚠️ Backup geocoding failed: {e}")
        
        # Hardcoded coordinates for major cities
        coordinates = {
            'ludhiana': (30.901, 75.857), 'chandigarh': (30.732, 76.779),
            'delhi': (28.704, 77.102), 'mumbai': (19.076, 72.877),
            'bangalore': (12.972, 77.594), 'chennai': (13.083, 80.270),
            'kolkata': (22.573, 88.364), 'hyderabad': (17.385, 78.487),
            'pune': (18.521, 73.856), 'ahmedabad': (23.023, 72.585)
        }
        
        search_terms = [location.district.lower(), location.state.lower()]
        for term in search_terms:
            for city, coords in coordinates.items():
                if term in city or city in term:
                    logger.info(f"✅ Using hardcoded coordinates for {city}")
                    return coords
        
        logger.warning("⚠️ Using default coordinates (Delhi)")
        return coordinates['delhi']

    def _mock_weather_data(self) -> WeatherData:
        """Generate mock weather data"""
        month = datetime.now().month
        
        if month in [6, 7, 8, 9]:  # Monsoon
            temp = np.random.uniform(22, 35)
            humidity = np.random.uniform(70, 90)
            rainfall = np.random.uniform(50, 300)
        elif month in [3, 4, 5]:  # Summer
            temp = np.random.uniform(28, 42)
            humidity = np.random.uniform(30, 60)
            rainfall = np.random.uniform(0, 20)
        else:  # Winter
            temp = np.random.uniform(10, 28)
            humidity = np.random.uniform(40, 70)
            rainfall = np.random.uniform(0, 30)
        
        logger.info("🎭 Generated mock weather data")
        return WeatherData(
            temperature=round(temp, 1),
            humidity=round(humidity, 1),
            rainfall_mm=round(rainfall, 1),
            season=self.determine_season(),
            wind_speed=round(np.random.uniform(2, 15), 1),
            pressure=round(np.random.uniform(1000, 1020), 1)
        )

    def determine_season(self) -> str:
        """Determine season"""
        month = datetime.now().month
        if month in [6, 7, 8, 9]:
            return 'kharif'
        elif month in [10, 11, 12, 1, 2, 3]:
            return 'rabi'
        else:
            return 'zaid'

# Soil Service
class SoilService:
    def __init__(self, data_manager: LocalDataManager):
        self.data_manager = data_manager

    def get_soil_data(self, location: Location) -> SoilData:
        """Get soil data from CSV"""
        soil_dict = self.data_manager.get_soil_data(location.state, location.district)
        
        if not soil_dict:
            return self._mock_soil_data()
        
        # Generate seasonal moisture
        month = datetime.now().month
        if month in [6, 7, 8, 9]:  # Monsoon
            moisture = np.random.uniform(40, 70)
        elif month in [3, 4, 5]:  # Summer
            moisture = np.random.uniform(10, 30)
        else:  # Winter
            moisture = np.random.uniform(20, 50)
        
        logger.info("✅ Got soil data from CSV")
        return SoilData(
            ph_level=float(soil_dict.get('ph_level', 6.5)),
            organic_matter_percent=float(soil_dict.get('organic_matter_percent', 2.5)),
            nitrogen_level=soil_dict.get('nitrogen_level', 'Medium'),
            phosphorus_level=soil_dict.get('phosphorus_level', 'Medium'),
            potassium_level=soil_dict.get('potassium_level', 'Medium'),
            moisture_percent=round(moisture, 1),
            primary_soil_type=soil_dict.get('primary_soil_type', 'Alluvial'),
            drainage=soil_dict.get('drainage', 'Good'),
            texture=soil_dict.get('texture', 'Loamy')
        )

    def _mock_soil_data(self) -> SoilData:
        """Generate mock soil data"""
        logger.info("🎭 Generated mock soil data")
        return SoilData(
            ph_level=6.5, organic_matter_percent=2.5,
            nitrogen_level='Medium', phosphorus_level='Medium', potassium_level='Medium',
            moisture_percent=35.0, primary_soil_type='Alluvial',
            drainage='Good', texture='Loamy'
        )

# Crop Predictor using Rules
class CropPredictor:
    def __init__(self, data_manager: LocalDataManager):
        self.data_manager = data_manager
        self.crop_rules = {
            'rice': {'temp_range': (20, 35), 'humidity_min': 60, 'ph_range': (5.5, 7.0), 'moisture_range': (30, 70), 'season': ['kharif'], 'score': 0.8},
            'wheat': {'temp_range': (15, 25), 'humidity_min': 40, 'ph_range': (6.0, 7.5), 'moisture_range': (15, 40), 'season': ['rabi'], 'score': 0.7},
            'maize': {'temp_range': (18, 32), 'humidity_min': 50, 'ph_range': (6.0, 7.0), 'moisture_range': (20, 50), 'season': ['kharif', 'rabi'], 'score': 0.6},
            'cotton': {'temp_range': (20, 35), 'humidity_min': 40, 'ph_range': (5.8, 8.0), 'moisture_range': (10, 30), 'season': ['kharif'], 'score': 0.5},
            'sugarcane': {'temp_range': (20, 35), 'humidity_min': 70, 'ph_range': (6.0, 7.5), 'moisture_range': (40, 80), 'season': ['kharif'], 'score': 0.6}
        }

    def predict_crops(self, weather: WeatherData, soil: SoilData, location: Location) -> List[Tuple[str, float]]:
        """Predict crops using rules"""
        predictions = []
        state_crops = self.data_manager.get_crops_by_state(location.state)
        
        for crop, rules in self.crop_rules.items():
            score = rules['score']
            
            # State crop bonus
            if state_crops and crop.title() in state_crops:
                score += 0.1
            
            # Temperature check
            temp_min, temp_max = rules['temp_range']
            if temp_min <= weather.temperature <= temp_max:
                score += 0.1
            elif abs(weather.temperature - temp_min) <= 5 or abs(weather.temperature - temp_max) <= 5:
                score += 0.05
            else:
                score -= 0.1
            
            # Humidity check
            if weather.humidity >= rules['humidity_min']:
                score += 0.05
            
            # pH check
            ph_min, ph_max = rules['ph_range']
            if ph_min <= soil.ph_level <= ph_max:
                score += 0.1
            else:
                score -= 0.05
            
            # Moisture check
            moist_min, moist_max = rules['moisture_range']
            if moist_min <= soil.moisture_percent <= moist_max:
                score += 0.1
            else:
                score -= 0.05
            
            # Season check
            if weather.season in rules['season']:
                score += 0.1
            
            score = max(0.0, min(1.0, score))
            predictions.append((crop, score))
        
        predictions.sort(key=lambda x: x[1], reverse=True)
        logger.info(f"🎯 Generated crop predictions for {location.state}")
        return predictions

# Main System - FULLY LOCAL!
class CropRecommendationSystem:
    def __init__(self):
        self.config = Config()
        self.data_manager = LocalDataManager()
        self.location_matcher = LocationMatcher(self.data_manager)
        self.weather_service = WeatherService(self.config.RAPIDAPI_WEATHER_KEY, self.config.MAPBOX_ACCESS_TOKEN)
        self.soil_service = SoilService(self.data_manager)
        self.crop_predictor = CropPredictor(self.data_manager)
        
        logger.info("🎉 SYSTEM READY - FULLY LOCAL, NO DATABASE!")

    def get_recommendations(self, user_input: str) -> Dict:
        """Get crop recommendations"""
        try:
            location = self.location_matcher.fuzzy_match_location(user_input)
            logger.info(f"📍 Location: {location.state}, {location.district}")
            
            weather_data = self.weather_service.get_weather_data(location)
            soil_data = self.soil_service.get_soil_data(location)
            crop_predictions = self.crop_predictor.predict_crops(weather_data, soil_data, location)
            
            recommendations = []
            for crop, confidence in crop_predictions[:3]:
                recommendation = self._create_recommendation(crop, confidence, weather_data, soil_data, location)
                recommendations.append(recommendation)
            
            return {
                "status": "success",
                "location": {"state": location.state, "district": location.district},
                "weather": asdict(weather_data),
                "soil": asdict(soil_data),
                "recommendations": [asdict(rec) for rec in recommendations],
                "data_sources": {
                    "weather": "RapidAPI + backup geocoding",
                    "soil": "Local CSV files + seasonal moisture",
                    "crops": "Local CSV + rule-based predictions"
                },
                "system_info": {
                    "version": self.config.MODEL_VERSION,
                    "database": "NONE - Fully local CSV files",
                    "complexity": "MINIMAL",
                    "timestamp": datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Error: {e}")
            return {"status": "error", "message": f"System error: {str(e)}"}

    def _create_recommendation(self, crop: str, confidence: float, weather: WeatherData, soil: SoilData, location: Location) -> CropRecommendation:
        """Create recommendation"""
        reasoning_parts = []
        risk_factors = []
        
        # Weather analysis
        if 20 <= weather.temperature <= 35:
            reasoning_parts.append(f"optimal temperature ({weather.temperature}°C)")
        elif weather.temperature > 35:
            reasoning_parts.append(f"high temperature ({weather.temperature}°C)")
            risk_factors.append("Heat stress risk")
        else:
            reasoning_parts.append(f"cool temperature ({weather.temperature}°C)")
        
        # Moisture analysis
        moisture_preferences = {
            'rice': {'min': 30, 'max': 70}, 'wheat': {'min': 15, 'max': 40},
            'maize': {'min': 20, 'max': 50}, 'cotton': {'min': 10, 'max': 30},
            'sugarcane': {'min': 40, 'max': 80}
        }
        
        crop_lower = crop.lower()
        pref = moisture_preferences.get(crop_lower, {'min': 20, 'max': 50})
        
        if soil.moisture_percent < pref['min']:
            reasoning_parts.append(f"low soil moisture ({soil.moisture_percent}% - needs irrigation)")
            risk_factors.append(f"Drought stress for {crop}")
        elif soil.moisture_percent > pref['max']:
            reasoning_parts.append(f"high soil moisture ({soil.moisture_percent}% - waterlogging risk)")
            risk_factors.append(f"Waterlogging risk for {crop}")
        else:
            reasoning_parts.append(f"suitable soil moisture ({soil.moisture_percent}%)")
        
        # pH analysis
        if 6.0 <= soil.ph_level <= 7.5:
            reasoning_parts.append(f"suitable pH ({soil.ph_level})")
        else:
            reasoning_parts.append(f"pH needs adjustment ({soil.ph_level})")
            risk_factors.append("Soil pH not optimal")
        
        # Season analysis
        if weather.season in ['kharif', 'rabi']:
            reasoning_parts.append(f"appropriate for {weather.season} season")
        
        reasoning = f"Recommended for {location.state} due to " + ", ".join(reasoning_parts)
        
        # Calculate suitability score
        suitability_score = confidence
        if 22 <= weather.temperature <= 30: suitability_score += 0.1
        if 25 <= soil.moisture_percent <= 45: suitability_score += 0.1
        if 6.5 <= soil.ph_level <= 7.0: suitability_score += 0.05
        suitability_score = min(suitability_score, 1.0)
        
        # Estimates
        base_yields = {'rice': 4.5, 'wheat': 3.2, 'maize': 5.8, 'cotton': 1.8, 'sugarcane': 75.0}
        base_investments = {'rice': 45000, 'wheat': 35000, 'maize': 40000, 'cotton': 50000, 'sugarcane': 80000}
        base_periods = {'rice': 120, 'wheat': 150, 'maize': 100, 'cotton': 180, 'sugarcane': 365}
        fertilizers = {'rice': "NPK 120:60:40 kg/ha", 'wheat': "NPK 120:60:40 kg/ha", 'maize': "NPK 150:75:60 kg/ha", 'cotton': "NPK 80:40:40 kg/ha"}
        
        yield_estimate = base_yields.get(crop_lower, 3.0)
        if 25 <= soil.moisture_percent <= 45: yield_estimate *= 1.1
        if 6.0 <= soil.ph_level <= 7.5: yield_estimate *= 1.05
        
        # Irrigation needs
        if soil.moisture_percent < 20:
            irrigation = "High - frequent irrigation needed"
        elif soil.moisture_percent < 35:
            irrigation = "Medium - regular irrigation recommended"
        else:
            irrigation = "Low - minimal irrigation needed"
        
        return CropRecommendation(
            crop_name=crop.title(),
            suitability_score=suitability_score,
            confidence=confidence,
            reasoning=reasoning,
            risk_factors=risk_factors,
            expected_yield_tons_per_hectare=round(yield_estimate, 1),
            investment_required_per_hectare=base_investments.get(crop_lower, 40000),
            profit_potential="High" if suitability_score >= 0.8 else "Medium" if suitability_score >= 0.6 else "Low",
            growing_period_days=base_periods.get(crop_lower, 120),
            irrigation_requirements=irrigation,
            fertilizer_recommendations=fertilizers.get(crop_lower, "NPK 100:50:50 kg/ha") + (" + Lime" if soil.ph_level < 6.0 else " + Gypsum" if soil.ph_level > 8.0 else "")
        )

    def get_system_status(self) -> Dict:
        """Get system status"""
        return {
            "version": self.config.MODEL_VERSION,
            "database": "NONE - Fully local system",
            "complexity": "MINIMAL - No MongoDB",
            "apis": {
                "rapidapi_weather": bool(self.config.RAPIDAPI_WEATHER_KEY),
                "mapbox_geocoding": bool(self.config.MAPBOX_ACCESS_TOKEN),
                "backup_geocoding": "Available (OpenStreetMap)"
            },
            "local_data": {
                "state_crops_loaded": self.data_manager.state_crop_df is not None,
                "soil_data_loaded": self.data_manager.district_soil_df is not None,
                "total_state_crop_records": len(self.data_manager.state_crop_df) if self.data_manager.state_crop_df is not None else 0,
                "total_soil_records": len(self.data_manager.district_soil_df) if self.data_manager.district_soil_df is not None else 0
            },
            "timestamp": datetime.now().isoformat()
        }

# CLI interface
def main():
    """CLI interface"""
    import argparse
    
    parser = argparse.ArgumentParser(description='LOCAL Crop Recommendation System (No Database)')
    parser.add_argument('--location', '-l', type=str, help='Location (e.g., "Ludhiana, Punjab")')
    parser.add_argument('--status', '-s', action='store_true', help='Show system status')
    
    args = parser.parse_args()
    
    print("🌾 Initializing LOCAL Crop Recommendation System...")
    system = CropRecommendationSystem()
    
    if args.status:
        status = system.get_system_status()
        print("\n📊 SYSTEM STATUS:")
        print(json.dumps(status, indent=2))
        return
    
    if args.location:
        print(f"\n🔍 Getting recommendations for: {args.location}")
        recommendations = system.get_recommendations(args.location)
        print("\n📋 RECOMMENDATIONS:")
        print(json.dumps(recommendations, indent=2))
        return
    
    # Interactive mode
    print("\n🌾 LOCAL Crop Recommendation System")
    print("✅ No MongoDB - All data local!")
    print("Enter location (e.g., 'Ludhiana, Punjab') or 'quit' to exit")
    
    while True:
        user_input = input("\nLocation: ").strip()
        
        if user_input.lower() in ['quit', 'exit', 'q']:
            break
        
        if user_input:
            recommendations = system.get_recommendations(user_input)
            print("\n📋 RECOMMENDATIONS:")
            print(json.dumps(recommendations, indent=2))

if __name__ == "__main__":
    main()
