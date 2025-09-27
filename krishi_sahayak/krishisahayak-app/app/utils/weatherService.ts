import * as Location from 'expo-location';

export interface OpenWeatherData {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    sea_level: number;
    grnd_level: number;
    humidity: number;
    temp_kf: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  clouds: {
    all: number;
  };
  wind: {
    speed: number;
    deg: number;
    gust: number;
  };
  visibility: number;
  pop: number;
  sys: {
    pod: string;
  };
  dt_txt: string;
  rain?: {
    '3h': number;
  };
}

export interface OpenWeatherResponse {
  cod: string;
  message: number;
  cnt: number;
  list: OpenWeatherData[];
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

export interface ProcessedWeatherData {
  day: string;
  date: string;
  temp: { high: number; low: number };
  condition: string;
  icon: string;
  humidity: number;
  wind: number;
  rain: number;
  uv: number;
  description: string;
  pressure: number;
  sunshine: number;
  feelsLike: number;
  visibility: number;
  cloudCover: number;
  windDirection: number;
  gust: number;
}

export interface CurrentWeatherData {
  temp: number;
  condition: string;
  icon: string;
  humidity: number;
  wind: number;
  rain: number;
  description: string;
  pressure: number;
  feelsLike: number;
  visibility: number;
  cloudCover: number;
  windDirection: number;
  gust: number;
  uv: number;
}

interface CachedWeatherData {
  data: CurrentWeatherData | ProcessedWeatherData[];
  timestamp: number;
  location: { latitude: number; longitude: number };
}

class WeatherService {
  private static instance: WeatherService;
  private readonly API_KEY = 'b975570183msh2977cb85a845889p1efb91jsn7c7b26ac40b0';
  private readonly BASE_URL = 'https://open-weather13.p.rapidapi.com';
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
  
  private currentWeatherCache: CachedWeatherData | null = null;
  private forecastCache: CachedWeatherData | null = null;

  static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  private isCacheValid(cache: CachedWeatherData | null, location: { latitude: number; longitude: number }): boolean {
    if (!cache) return false;
    
    const now = Date.now();
    const isExpired = (now - cache.timestamp) > this.CACHE_DURATION;
    const isLocationChanged = Math.abs(cache.location.latitude - location.latitude) > 0.01 || 
                             Math.abs(cache.location.longitude - location.longitude) > 0.01;
    
    return !isExpired && !isLocationChanged;
  }

  async getCurrentWeather(): Promise<CurrentWeatherData | null> {
    try {
      console.log('Starting current weather fetch...');
      
      const location = await this.getCurrentLocation();
      if (!location) {
        console.log('No location available, using mock data');
        return this.getMockCurrentWeatherData();
      }

      // Check cache first
      if (this.isCacheValid(this.currentWeatherCache, location)) {
        console.log('Using cached current weather data');
        return this.currentWeatherCache!.data as CurrentWeatherData;
      }

      console.log('Location found:', location);

      const { latitude, longitude } = location;
      const url = `${this.BASE_URL}/latlon?latitude=${latitude}&longitude=${longitude}&lang=EN`;

      console.log('Fetching current weather for:', { latitude, longitude });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.API_KEY,
          'X-RapidAPI-Host': 'open-weather13.p.rapidapi.com',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('API Response status:', response.status);

      if (!response.ok) {
        console.log('API Error:', response.status, response.statusText);
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Current weather data received:', data);
      
      const processedData = this.processCurrentWeatherData(data);
      
      // Cache the result
      this.currentWeatherCache = {
        data: processedData,
        timestamp: Date.now(),
        location: { latitude, longitude }
      };
      
      return processedData;
    } catch (error) {
      console.error('Error fetching current weather data:', error);
      // Return cached data if available, otherwise mock data
      if (this.currentWeatherCache) {
        console.log('Using cached data due to error');
        return this.currentWeatherCache.data as CurrentWeatherData;
      }
      return this.getMockCurrentWeatherData();
    }
  }

  async getWeatherForecast(): Promise<ProcessedWeatherData[]> {
    try {
      console.log('Starting weather forecast fetch...');
      
      const location = await this.getCurrentLocation();
      if (!location) {
        console.log('No location available, using mock data');
        return this.getMockWeatherData();
      }

      // Check cache first
      if (this.isCacheValid(this.forecastCache, location)) {
        console.log('Using cached forecast data');
        return this.forecastCache!.data as ProcessedWeatherData[];
      }

      console.log('Location found:', location);

      const { latitude, longitude } = location;
      const url = `${this.BASE_URL}/fivedaysforcast?latitude=${latitude}&longitude=${longitude}&lang=EN`;

      console.log('Fetching weather for:', { latitude, longitude });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.API_KEY,
          'X-RapidAPI-Host': 'open-weather13.p.rapidapi.com',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('API Response status:', response.status);

      if (!response.ok) {
        console.log('API Error:', response.status, response.statusText);
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data: OpenWeatherResponse = await response.json();
      console.log('API Data received:', data);
      
      if (!data.list || data.list.length === 0) {
        console.log('No weather data in response, using mock data');
        return this.getMockWeatherData();
      }

      const processedData = this.processWeatherData(data.list, data.city);
      
      // Cache the result
      this.forecastCache = {
        data: processedData,
        timestamp: Date.now(),
        location: { latitude, longitude }
      };
      
      return processedData;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Return cached data if available, otherwise mock data
      if (this.forecastCache) {
        console.log('Using cached forecast data due to error');
        return this.forecastCache.data as ProcessedWeatherData[];
      }
      return this.getMockWeatherData();
    }
  }

  private processCurrentWeatherData(data: any): CurrentWeatherData {
    // Process the current weather API response
    const temp = Math.round(data.main.temp - 273.15); // Convert from Kelvin to Celsius
    const feelsLike = Math.round(data.main.feels_like - 273.15);
    const humidity = data.main.humidity;
    const pressure = data.main.pressure;
    const wind = Math.round(data.wind.speed * 3.6); // Convert m/s to km/h
    const windDirection = data.wind.deg;
    const gust = Math.round((data.wind.gust || 0) * 3.6);
    const visibility = Math.round(data.visibility / 1000); // Convert to km
    const cloudCover = data.clouds.all;
    const rain = data.rain ? data.rain['1h'] || 0 : 0;
    
    // Calculate UV index based on cloud cover and temperature
    const uvIndex = this.calculateUVIndex(cloudCover, temp + 273.15, new Date());
    
    return {
      temp,
      condition: this.getWeatherCondition(data.weather[0].main, data.weather[0].description),
      icon: this.getWeatherIcon(data.weather[0].icon, data.weather[0].main),
      humidity,
      wind,
      rain: Math.round(rain),
      description: this.getFarmingDescription(temp, rain, cloudCover, wind),
      pressure,
      feelsLike,
      visibility,
      cloudCover,
      windDirection,
      gust,
      uv: uvIndex
    };
  }

  private processWeatherData(weatherData: OpenWeatherData[], city: OpenWeatherResponse['city']): ProcessedWeatherData[] {
    const processedData: ProcessedWeatherData[] = [];
    const dailyData = this.groupDataByDay(weatherData);

    dailyData.forEach((dayData, index) => {
      const date = new Date(dayData[0].dt * 1000);
      const dayName = this.getDayName(date, index);
      const dateStr = this.formatDisplayDate(date);

      // Calculate min/max temperatures for the day
      const temps = dayData.map(item => item.main.temp);
      const minTemp = Math.min(...temps);
      const maxTemp = Math.max(...temps);

      // Get the most representative weather condition (usually the one at noon)
      const noonData = dayData.find(item => {
        const hour = new Date(item.dt * 1000).getHours();
        return hour >= 11 && hour <= 14;
      }) || dayData[Math.floor(dayData.length / 2)];

      // Calculate average values for the day
      const avgHumidity = Math.round(dayData.reduce((sum, item) => sum + item.main.humidity, 0) / dayData.length);
      const avgWind = Math.round(dayData.reduce((sum, item) => sum + item.wind.speed, 0) / dayData.length);
      const avgPressure = Math.round(dayData.reduce((sum, item) => sum + item.main.pressure, 0) / dayData.length);
      const avgCloudCover = Math.round(dayData.reduce((sum, item) => sum + item.clouds.all, 0) / dayData.length);
      const maxGust = Math.max(...dayData.map(item => item.wind.gust));

      // Calculate total rain for the day
      const totalRain = dayData.reduce((sum, item) => {
        return sum + (item.rain ? item.rain['3h'] : 0);
      }, 0);

      // Calculate UV index based on cloud cover and time of day
      const uvIndex = this.calculateUVIndex(avgCloudCover, maxTemp, date);

      processedData.push({
        day: dayName,
        date: dateStr,
        temp: {
          high: Math.round(maxTemp - 273.15), // Convert from Kelvin to Celsius
          low: Math.round(minTemp - 273.15),
        },
        condition: this.getWeatherCondition(noonData.weather[0].main, noonData.weather[0].description),
        icon: this.getWeatherIcon(noonData.weather[0].icon, noonData.weather[0].main),
        humidity: avgHumidity,
        wind: avgWind,
        rain: Math.round(totalRain),
        uv: uvIndex,
        description: this.getFarmingDescription(maxTemp - 273.15, totalRain, avgCloudCover, avgWind),
        pressure: avgPressure,
        sunshine: this.calculateSunshineHours(dayData, city.sunrise, city.sunset),
        feelsLike: Math.round(noonData.main.feels_like - 273.15),
        visibility: Math.round(dayData.reduce((sum, item) => sum + item.visibility, 0) / dayData.length / 1000), // Convert to km
        cloudCover: avgCloudCover,
        windDirection: Math.round(dayData.reduce((sum, item) => sum + item.wind.deg, 0) / dayData.length),
        gust: Math.round(maxGust),
      });
    });

    return processedData;
  }

  private groupDataByDay(weatherData: OpenWeatherData[]): OpenWeatherData[][] {
    const grouped: { [key: string]: OpenWeatherData[] } = {};
    
    weatherData.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toDateString();
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });

    // Return only the first 5 days
    return Object.values(grouped).slice(0, 5);
  }

  private getDayName(date: Date, index: number): string {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  }

  private formatDisplayDate(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    return `${month} ${day}`;
  }

  private getWeatherCondition(main: string, description: string): string {
    const conditionMap: { [key: string]: string } = {
      'Clear': 'Sunny',
      'Clouds': 'Cloudy',
      'Rain': 'Rainy',
      'Drizzle': 'Light Rain',
      'Thunderstorm': 'Thunderstorm',
      'Snow': 'Snowy',
      'Mist': 'Foggy',
      'Fog': 'Foggy',
      'Haze': 'Hazy',
    };
    
    return conditionMap[main] || description;
  }

  private getWeatherIcon(iconCode: string, main: string): string {
    const iconMap: { [key: string]: string } = {
      '01d': 'sunny',
      '01n': 'moon',
      '02d': 'partly-sunny',
      '02n': 'cloudy-night',
      '03d': 'cloudy',
      '03n': 'cloudy',
      '04d': 'cloudy',
      '04n': 'cloudy',
      '09d': 'rainy',
      '09n': 'rainy',
      '10d': 'rainy',
      '10n': 'rainy',
      '11d': 'thunderstorm',
      '11n': 'thunderstorm',
      '13d': 'snow',
      '13n': 'snow',
      '50d': 'cloudy',
      '50n': 'cloudy',
    };
    
    return iconMap[iconCode] || 'partly-sunny';
  }

  private calculateUVIndex(cloudCover: number, maxTemp: number, date: Date): number {
    const month = date.getMonth();
    const isSummer = month >= 5 && month <= 8; // June to September
    const cloudFactor = Math.max(0, (100 - cloudCover) / 100);
    const tempFactor = Math.min(maxTemp / 300, 1); // Normalize temperature
    
    let baseUV = isSummer ? 8 : 4;
    baseUV *= cloudFactor;
    baseUV *= tempFactor;
    
    return Math.round(Math.max(1, Math.min(11, baseUV)));
  }

  private calculateSunshineHours(dayData: OpenWeatherData[], sunrise: number, sunset: number): number {
    // Calculate theoretical sunshine hours based on sunrise/sunset
    const sunriseTime = new Date(sunrise * 1000);
    const sunsetTime = new Date(sunset * 1000);
    const dayLength = (sunsetTime.getTime() - sunriseTime.getTime()) / (1000 * 60 * 60);
    
    // Adjust based on cloud cover
    const avgCloudCover = dayData.reduce((sum, item) => sum + item.clouds.all, 0) / dayData.length;
    const cloudFactor = Math.max(0, (100 - avgCloudCover) / 100);
    
    return Math.round(dayLength * cloudFactor);
  }

  private getFarmingDescription(temp: number, rain: number, cloudCover: number, wind: number): string {
    if (rain > 10) {
      return 'Heavy rain expected. Avoid field work and check drainage systems.';
    }
    if (rain > 2) {
      return 'Light rain expected. Good for irrigation, avoid spraying pesticides.';
    }
    if (temp > 30) {
      return 'Hot weather. Increase irrigation frequency and provide shade for sensitive crops.';
    }
    if (temp < 5) {
      return 'Cold weather. Protect sensitive crops and consider covering.';
    }
    if (wind > 15) {
      return 'Windy conditions. Avoid spraying and check for crop damage.';
    }
    if (cloudCover < 30) {
      return 'Perfect weather for farming activities and harvesting.';
    }
    return 'Good conditions for general farming activities.';
  }

  getMockWeatherData(): ProcessedWeatherData[] {
    // Fallback mock data
    return [
      {
        day: 'Today',
        date: 'Dec 15',
        temp: { high: 28, low: 18 },
        condition: 'Partly Cloudy',
        icon: 'partly-sunny',
        humidity: 65,
        wind: 12,
        rain: 20,
        uv: 6,
        description: 'Good conditions for crop growth',
        pressure: 1013,
        sunshine: 8,
        feelsLike: 30,
        visibility: 10,
        cloudCover: 40,
        windDirection: 180,
        gust: 15,
      },
      {
        day: 'Tomorrow',
        date: 'Dec 16',
        temp: { high: 26, low: 16 },
        condition: 'Light Rain',
        icon: 'rainy',
        humidity: 78,
        wind: 15,
        rain: 60,
        uv: 4,
        description: 'Ideal for irrigation, avoid spraying',
        pressure: 1010,
        sunshine: 4,
        feelsLike: 28,
        visibility: 8,
        cloudCover: 80,
        windDirection: 200,
        gust: 20,
      },
      {
        day: 'Wed',
        date: 'Dec 17',
        temp: { high: 24, low: 14 },
        condition: 'Heavy Rain',
        icon: 'thunderstorm',
        humidity: 85,
        wind: 20,
        rain: 90,
        uv: 2,
        description: 'Avoid field work, check drainage',
        pressure: 1008,
        sunshine: 2,
        feelsLike: 26,
        visibility: 5,
        cloudCover: 95,
        windDirection: 220,
        gust: 25,
      },
      {
        day: 'Thu',
        date: 'Dec 18',
        temp: { high: 22, low: 12 },
        condition: 'Cloudy',
        icon: 'cloudy',
        humidity: 70,
        wind: 10,
        rain: 30,
        uv: 3,
        description: 'Good for planting activities',
        pressure: 1015,
        sunshine: 3,
        feelsLike: 24,
        visibility: 7,
        cloudCover: 70,
        windDirection: 160,
        gust: 12,
      },
      {
        day: 'Fri',
        date: 'Dec 19',
        temp: { high: 25, low: 15 },
        condition: 'Sunny',
        icon: 'sunny',
        humidity: 55,
        wind: 8,
        rain: 5,
        uv: 8,
        description: 'Perfect for harvesting',
        pressure: 1020,
        sunshine: 10,
        feelsLike: 27,
        visibility: 12,
        cloudCover: 20,
        windDirection: 140,
        gust: 10,
      },
    ];
  }

  getMockCurrentWeatherData(): CurrentWeatherData {
    // Fallback mock data for current weather
    return {
      temp: 28,
      condition: 'Partly Cloudy',
      icon: 'partly-sunny',
      humidity: 65,
      wind: 12,
      rain: 20,
      description: 'Good conditions for crop growth',
      pressure: 1013,
      feelsLike: 30,
      visibility: 10,
      cloudCover: 40,
      windDirection: 180,
      gust: 15,
      uv: 6
    };
  }

  // Method to clear cache (useful for testing or manual refresh)
  clearCache(): void {
    this.currentWeatherCache = null;
    this.forecastCache = null;
    console.log('Weather cache cleared');
  }

  // Method to get cache status for debugging
  getCacheStatus(): { current: boolean; forecast: boolean; lastUpdate?: number } {
    const now = Date.now();
    return {
      current: this.currentWeatherCache ? (now - this.currentWeatherCache.timestamp) < this.CACHE_DURATION : false,
      forecast: this.forecastCache ? (now - this.forecastCache.timestamp) < this.CACHE_DURATION : false,
      lastUpdate: this.currentWeatherCache?.timestamp
    };
  }
}

export const weatherService = WeatherService.getInstance();