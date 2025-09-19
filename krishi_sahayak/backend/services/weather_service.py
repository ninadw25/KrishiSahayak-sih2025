"""
Weather Service for KrishiSahayak
Fetches weather data using RapidAPI Open Weather service
"""

import requests
import os
from typing import Optional, Dict, Any
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

# Set up logging
logger = logging.getLogger(__name__)

class WeatherService:
    """Weather service to fetch weather data by coordinates"""
    
    def __init__(self):
        self.base_url = "https://open-weather13.p.rapidapi.com/latlon"
        self.api_key = os.getenv("RAPIDAPI_WEATHER_KEY", "9610c450e3mshbfc952b07fa8bf1p19500cjsn9919bf047129")
        self.headers = {
            "x-rapidapi-key": self.api_key,
            "x-rapidapi-host": "open-weather13.p.rapidapi.com"
        }
    
    def get_weather_by_coordinates(self, latitude: float, longitude: float, language: str = "EN") -> Optional[Dict[str, Any]]:
        """
        Fetch weather data for given coordinates
        
        Args:
            latitude: Latitude coordinate (-90 to 90)
            longitude: Longitude coordinate (-180 to 180)
            language: Language code (default: EN)
            
        Returns:
            Weather data dictionary or None if failed
        """
        try:
            querystring = {
                "latitude": str(latitude),
                "longitude": str(longitude),
                "lang": language
            }
            
            logger.info(f"Fetching weather for coordinates: {latitude}, {longitude}")
            
            response = requests.get(
                self.base_url, 
                headers=self.headers, 
                params=querystring,
                timeout=10
            )
            
            if response.status_code == 200:
                weather_data = response.json()
                logger.info("Weather data fetched successfully")
                return weather_data
            else:
                logger.error(f"Weather API error: {response.status_code} - {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error fetching weather: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching weather: {e}")
            return None
    
    def parse_weather_response(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse raw weather API response into standardized format
        
        Args:
            raw_data: Raw API response
            
        Returns:
            Parsed weather data
        """
        try:
            # Extract main weather info
            main = raw_data.get('main', {})
            weather = raw_data.get('weather', [{}])[0] if raw_data.get('weather') else {}
            wind = raw_data.get('wind', {})
            clouds = raw_data.get('clouds', {})
            coord = raw_data.get('coord', {})
            sys = raw_data.get('sys', {})
            
            # Convert timezone from seconds to readable format
            timezone_seconds = raw_data.get('timezone')
            timezone_str = None
            if timezone_seconds is not None:
                hours = timezone_seconds // 3600
                timezone_str = f"UTC{hours:+d}" if hours != 0 else "UTC"
            
            parsed = {
                # Temperature data (convert from Kelvin to Celsius)
                "temperature": round(main.get('temp', 0) - 273.15, 1) if main.get('temp') else 0,
                "feels_like": round(main.get('feels_like', 0) - 273.15, 1) if main.get('feels_like') else None,
                "humidity": main.get('humidity', 0),
                "pressure": main.get('pressure'),
                
                # Weather condition
                "weather_condition": weather.get('description', 'Unknown'),
                "weather_icon": weather.get('icon'),
                
                # Wind data (convert from m/s to km/h)
                "wind_speed": round(wind.get('speed', 0) * 3.6, 2) if wind.get('speed') else None,
                "wind_direction": wind.get('deg'),
                
                # Other data
                "cloud_coverage": clouds.get('all'),
                "visibility": raw_data.get('visibility', 0) / 1000 if raw_data.get('visibility') else None,  # Convert to km
                "uv_index": None,  # Not provided by this API
                
                # Location
                "latitude": coord.get('lat'),
                "longitude": coord.get('lon'),
                "city": raw_data.get('name'),
                "country": sys.get('country'),
                "timezone": timezone_str
            }
            
            return parsed
            
        except Exception as e:
            logger.error(f"Error parsing weather response: {e}")
            return {}

# Global weather service instance
weather_service = WeatherService()

def get_weather(latitude: float, longitude: float, language: str = "EN") -> Optional[Dict[str, Any]]:
    """
    Simple function to get weather data
    
    Args:
        latitude: Latitude coordinate
        longitude: Longitude coordinate  
        language: Language code
        
    Returns:
        Parsed weather data or None
    """
    raw_data = weather_service.get_weather_by_coordinates(latitude, longitude, language)
    if raw_data:
        return weather_service.parse_weather_response(raw_data)
    return None

# For backward compatibility with existing code
if __name__ == "__main__":
    # Test the service
    test_lat = 40.730610
    test_lon = -73.935242
    
    print(f"Testing weather service for coordinates: {test_lat}, {test_lon}")
    weather_data = get_weather(test_lat, test_lon)
    
    if weather_data:
        print("Weather data retrieved successfully:")
        for key, value in weather_data.items():
            print(f"  {key}: {value}")
    else:
        print("Failed to retrieve weather data")