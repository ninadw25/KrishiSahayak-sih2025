import Constants from 'expo-constants';
import { MarketFactor, MarketNewsItem, ProcessedMarketData } from './marketService';
import { ProcessedWeatherData } from './weatherService';

export interface WeatherAlert {
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
}

export interface FarmingTip {
  condition: string;
  tips: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface WeatherInsights {
  alerts: WeatherAlert[];
  farmingTips: FarmingTip[];
  generalAdvice: string;
}

export interface MarketInsights {
  marketNews: MarketNewsItem[];
  marketFactors: MarketFactor[];
  generalAdvice: string;
}

export interface Pesticide {
  name: string;
  activeIngredient: string;
  dosage: string;
  applicationMethod: string;
  frequency: string;
  safetyPrecautions: string[];
  effectiveness: number;
  price: string;
}

export interface PestDetectionResult {
  pest: string;
  confidence: number;
  severity: string;
  description: string;
  damage: string[];
  pesticides: Pesticide[];
}

export interface CropRecommendation {
  id: number;
  name: string;
  variety: string;
  suitability: number;
  yield: string;
  profit: string;
  duration: string;
  water: string;
  sustainability: number;
  image: string;
  benefits: string[];
  requirements: string[];
  marketDemand: 'High' | 'Medium' | 'Low';
  riskLevel: 'Low' | 'Medium' | 'High';
  bestPlantingTime: string;
  expectedROI: string;
}

export interface CropRecommendationRequest {
  season: string;
  soilType: string;
  location: {
    name: string;
    coordinates?: { latitude: number; longitude: number };
    state?: string;
    district?: string;
  };
  preferences?: {
    waterAvailability: 'High' | 'Medium' | 'Low';
    budget: 'Low' | 'Medium' | 'High';
    experience: 'Beginner' | 'Intermediate' | 'Expert';
    farmSize: 'Small' | 'Medium' | 'Large';
  };
}

class LLMService {
  private static instance: LLMService;
  private readonly EXPO_PUBLIC_GEMINI_API_KEY = Constants.expoConfig?.extra?.geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyApkIuwGtsB86lNcvyO4nmOe67nnB-TgSw';
  private readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  async generateWeatherInsights(weatherData: ProcessedWeatherData[]): Promise<WeatherInsights> {
    try {
      console.log('Generating weather insights with LLM...');
      console.log('API Key configured:', !!this.EXPO_PUBLIC_GEMINI_API_KEY);
      console.log('API Key length:', this.EXPO_PUBLIC_GEMINI_API_KEY?.length);
      
      // Check if API key is configured
      if (this.EXPO_PUBLIC_GEMINI_API_KEY === 'your_gemini_api_key_here' || !this.EXPO_PUBLIC_GEMINI_API_KEY) {
        console.log('Gemini API key not configured, using fallback insights');
        return this.getFallbackInsights(weatherData);
      }
      
      const prompt = this.createWeatherPrompt(weatherData);
      console.log('Prompt created, calling Gemini API...');
      const response = await this.callGeminiAPI(prompt);
      console.log('Gemini API response received');
      
      return this.parseLLMResponse(response);
    } catch (error) {
      console.error('Error generating weather insights:', error);
      console.log('Falling back to rule-based insights');
      return this.getFallbackInsights(weatherData);
    }
  }

  private createWeatherPrompt(weatherData: ProcessedWeatherData[]): string {
    const currentWeather = weatherData[0];
    const forecast = weatherData.slice(1, 5);

    return `You are an expert agricultural advisor. Based on the following weather data, provide farming recommendations and alerts.

CURRENT WEATHER:
- Temperature: ${currentWeather.temp.high}°C high, ${currentWeather.temp.low}°C low
- Condition: ${currentWeather.condition}
- Humidity: ${currentWeather.humidity}%
- Wind: ${currentWeather.wind} km/h (gusts up to ${currentWeather.gust} km/h)
- Precipitation: ${currentWeather.rain}mm
- UV Index: ${currentWeather.uv}
- Visibility: ${currentWeather.visibility}km
- Cloud Cover: ${currentWeather.cloudCover}%

5-DAY FORECAST:
${forecast.map((day, index) => `
Day ${index + 1} (${day.day}):
- Temperature: ${day.temp.high}°C high, ${day.temp.low}°C low
- Condition: ${day.condition}
- Humidity: ${day.humidity}%
- Wind: ${day.wind} km/h
- Precipitation: ${day.rain}mm
- UV Index: ${day.uv}
`).join('')}

Please provide:
1. WEATHER ALERTS (2-3 alerts): Critical weather conditions that farmers should be aware of
2. FARMING TIPS (3-4 categories): Specific advice for different weather conditions
3. GENERAL ADVICE: Overall farming recommendations for the week

Format your response as JSON:
{
  "alerts": [
    {
      "type": "warning|info|success",
      "title": "Alert title",
      "message": "Detailed alert message",
      "time": "Time ago (e.g., '2 hours ago')",
      "priority": "high|medium|low"
    }
  ],
  "farmingTips": [
    {
      "condition": "Weather condition name",
      "tips": ["Tip 1", "Tip 2", "Tip 3"],
      "priority": "high|medium|low"
    }
  ],
  "generalAdvice": "Overall farming advice for the week"
}

Focus on practical, actionable advice for farmers. Consider crop protection, irrigation, pest control, and field work timing.`;
  }

  async callGeminiAPI(prompt: string): Promise<string> {
    const url = `${this.GEMINI_API_URL}?key=${this.EXPO_PUBLIC_GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error details:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid Gemini API response:', data);
      throw new Error('Invalid response from Gemini API');
    }
    
    return data.candidates[0].content.parts[0].text;
  }

  private parseLLMResponse(response: string): WeatherInsights {
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        alerts: parsed.alerts || [],
        farmingTips: parsed.farmingTips || [],
        generalAdvice: parsed.generalAdvice || 'Monitor weather conditions and adjust farming practices accordingly.'
      };
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      throw error;
    }
  }

  async testApiConnection(): Promise<boolean> {
    try {
      const testPrompt = "Say 'API connection successful' in JSON format: {\"status\": \"success\"}";
      const response = await this.callGeminiAPI(testPrompt);
      const parsed = JSON.parse(response);
      return parsed.status === 'success';
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  async generateMarketInsights(marketData: ProcessedMarketData[], location: { countryName: string; principalSubdivision: string; locality: string }): Promise<MarketInsights> {
    try {
      console.log('Generating market insights with LLM...');
      console.log('API Key configured:', !!this.EXPO_PUBLIC_GEMINI_API_KEY);
      
      // Check if API key is configured
      if (this.EXPO_PUBLIC_GEMINI_API_KEY === 'your_gemini_api_key_here' || !this.EXPO_PUBLIC_GEMINI_API_KEY) {
        console.log('Gemini API key not configured, using fallback market insights');
        return this.getFallbackMarketInsights(marketData, location);
      }
      
      const prompt = this.createMarketPrompt(marketData, location);
      console.log('Market prompt created, calling Gemini API...');
      const response = await this.callGeminiAPI(prompt);
      console.log('Gemini API response received for market insights');
      
      return this.parseMarketResponse(response);
    } catch (error) {
      console.error('Error generating market insights:', error);
      console.log('Falling back to rule-based market insights');
      return this.getFallbackMarketInsights(marketData, location);
    }
  }

  private createMarketPrompt(marketData: ProcessedMarketData[], location: { countryName: string; principalSubdivision: string; locality: string }): string {
    const topCommodities = marketData.slice(0, 5);
    
    return `You are an expert agricultural market analyst. Based on the following market data from ${location.locality}, ${location.principalSubdivision}, provide market insights and analysis.

LOCATION: ${location.locality}, ${location.principalSubdivision}, ${location.countryName}

MARKET DATA:
${topCommodities.map((commodity, index) => `
${index + 1}. ${commodity.commodity} (${commodity.variety} - ${commodity.grade}):
   - Current Price: ₹${commodity.currentPrice}/quintal
   - Price Change: ${commodity.priceChangePercent > 0 ? '+' : ''}${commodity.priceChangePercent}% (${commodity.trend} trend)
   - Price Range: ₹${commodity.minPrice} - ₹${commodity.maxPrice}
   - Average Price: ₹${commodity.averagePrice}
   - Demand: ${commodity.demand} | Supply: ${commodity.supply}
   - Forecast: ${commodity.forecast}
   - Markets: ${commodity.marketCount} markets
   - Last Updated: ${commodity.lastUpdated}
`).join('')}

Please provide:
1. MARKET NEWS (3-4 news items): Recent developments affecting agricultural markets
2. MARKET FACTORS (4-5 factors): Key factors influencing prices and market conditions
3. GENERAL ADVICE: Overall market recommendations for farmers

Format your response as JSON:
{
  "marketNews": [
    {
      "title": "News headline",
      "summary": "Brief summary of the news",
      "impact": "Positive|Negative|Neutral",
      "time": "Time ago (e.g., '2 hours ago', '1 day ago')",
      "source": "News source"
    }
  ],
  "marketFactors": [
    {
      "factor": "Factor name",
      "impact": "Positive|Negative|Neutral",
      "description": "Detailed description of the factor",
      "icon": "icon-name"
    }
  ],
  "generalAdvice": "Overall market advice for farmers in this region"
}

Focus on practical, actionable market intelligence for farmers. Consider price trends, demand-supply dynamics, seasonal factors, government policies, and export-import scenarios.`;
  }

  private parseMarketResponse(response: string): MarketInsights {
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        marketNews: parsed.marketNews || [],
        marketFactors: parsed.marketFactors || [],
        generalAdvice: parsed.generalAdvice || 'Monitor market trends and adjust selling strategies accordingly.'
      };
    } catch (error) {
      console.error('Error parsing market LLM response:', error);
      throw error;
    }
  }

  private getFallbackMarketInsights(marketData: ProcessedMarketData[], location: { countryName: string; principalSubdivision: string; locality: string }): MarketInsights {
    const topCommodity = marketData[0];
    
    const marketNews: MarketNewsItem[] = [
      {
        title: 'Market Data Analysis Complete',
        summary: `Price trends analyzed for ${marketData.length} commodities in ${location.locality}`,
        impact: 'Positive',
        time: 'Just now',
        source: 'KrishiSahayak AI'
      }
    ];

    if (topCommodity) {
      if (topCommodity.trend === 'up') {
        marketNews.push({
          title: `${topCommodity.commodity} Prices Rising`,
          summary: `Strong upward trend with ${topCommodity.priceChangePercent}% increase`,
          impact: 'Positive',
          time: '1 hour ago',
          source: 'Market Analysis'
        });
      } else if (topCommodity.trend === 'down') {
        marketNews.push({
          title: `${topCommodity.commodity} Prices Declining`,
          summary: `Prices down by ${Math.abs(topCommodity.priceChangePercent)}% due to market conditions`,
          impact: 'Negative',
          time: '2 hours ago',
          source: 'Market Analysis'
        });
      }
    }

    const marketFactors: MarketFactor[] = [
      {
        factor: 'Seasonal Demand',
        impact: 'Positive',
        description: 'Festival season typically increases demand for agricultural products',
        icon: 'calendar'
      },
      {
        factor: 'Government MSP',
        impact: 'Positive',
        description: 'Minimum Support Price provides price stability for farmers',
        icon: 'shield-checkmark'
      },
      {
        factor: 'Export Opportunities',
        impact: 'Positive',
        description: 'International demand can boost local prices',
        icon: 'globe'
      },
      {
        factor: 'Weather Conditions',
        impact: 'Neutral',
        description: 'Weather patterns affect crop production and pricing',
        icon: 'cloud'
      }
    ];

    let generalAdvice = `Based on current market data for ${location.locality}, `;
    if (topCommodity) {
      generalAdvice += `${topCommodity.commodity} shows a ${topCommodity.trend} trend with ${topCommodity.demand} demand. `;
      if (topCommodity.trend === 'up') {
        generalAdvice += 'Consider selling during peak prices. ';
      } else if (topCommodity.trend === 'down') {
        generalAdvice += 'Monitor for price recovery before selling. ';
      }
    }
    generalAdvice += 'Stay updated with market trends and government policies for better decision making.';

    return {
      marketNews,
      marketFactors,
      generalAdvice
    };
  }

  async generatePestDetectionResult(pestName: string, basePesticides: string[]): Promise<PestDetectionResult> {
    try {
      console.log('Generating pest detection result with LLM...');
      console.log('Pest:', pestName, 'Base pesticides:', basePesticides);
      
      // Check if API key is configured
      if (this.EXPO_PUBLIC_GEMINI_API_KEY === 'your_gemini_api_key_here' || !this.EXPO_PUBLIC_GEMINI_API_KEY) {
        console.log('Gemini API key not configured, using fallback pest data');
        return this.getFallbackPestData(pestName, basePesticides);
      }
      
      const prompt = this.createPestDetectionPrompt(pestName, basePesticides);
      console.log('Pest detection prompt created, calling Gemini API...');
      const response = await this.callGeminiAPI(prompt);
      console.log('Gemini API response received for pest detection');
      
      return this.parsePestDetectionResponse(response);
    } catch (error) {
      console.error('Error generating pest detection result:', error);
      console.log('Falling back to rule-based pest data');
      return this.getFallbackPestData(pestName, basePesticides);
    }
  }

  private createPestDetectionPrompt(pestName: string, basePesticides: string[]): string {
    return `You are an expert agricultural pest management specialist. Generate comprehensive pest detection data for "${pestName}" with detailed pesticide recommendations.

PEST NAME: ${pestName}
BASE PESTICIDES TO INCLUDE: ${basePesticides.join(', ')}

Please provide detailed information including:

1. PEST DESCRIPTION: Scientific and common characteristics
2. DAMAGE CAUSED: Specific damage symptoms and effects on crops
3. PESTICIDE RECOMMENDATIONS: Detailed information for each pesticide including:
   - Active ingredients
   - Dosage instructions
   - Application methods
   - Safety precautions
   - Effectiveness ratings
   - Price estimates

Format your response as JSON:
{
  "pest": "${pestName}",
  "confidence": 85-95,
  "severity": "Low|Medium|High",
  "description": "Detailed description of the pest, its characteristics, and behavior",
  "damage": [
    "Specific damage symptom 1",
    "Specific damage symptom 2",
    "Specific damage symptom 3",
    "Specific damage symptom 4"
  ],
  "pesticides": [
    {
      "name": "Pesticide Name 1",
      "activeIngredient": "Chemical compound name",
      "dosage": "Specific dosage instructions",
      "applicationMethod": "Detailed application method",
      "frequency": "Application frequency",
      "safetyPrecautions": [
        "Safety precaution 1",
        "Safety precaution 2",
        "Safety precaution 3",
        "Safety precaution 4"
      ],
      "effectiveness": 75-95,
      "price": "₹X-Y per unit"
    },
    {
      "name": "Pesticide Name 2",
      "activeIngredient": "Chemical compound name",
      "dosage": "Specific dosage instructions",
      "applicationMethod": "Detailed application method",
      "frequency": "Application frequency",
      "safetyPrecautions": [
        "Safety precaution 1",
        "Safety precaution 2",
        "Safety precaution 3",
        "Safety precaution 4"
      ],
      "effectiveness": 75-95,
      "price": "₹X-Y per unit"
    },
    {
      "name": "Pesticide Name 3",
      "activeIngredient": "Chemical compound name",
      "dosage": "Specific dosage instructions",
      "applicationMethod": "Detailed application method",
      "frequency": "Application frequency",
      "safetyPrecautions": [
        "Safety precaution 1",
        "Safety precaution 2",
        "Safety precaution 3",
        "Safety precaution 4"
      ],
      "effectiveness": 75-95,
      "price": "₹X-Y per unit"
    }
  ]
}

IMPORTANT GUIDELINES:
- Include the base pesticides provided in your recommendations
- Make descriptions practical and farmer-friendly
- Provide realistic effectiveness ratings (75-95%)
- Include appropriate safety precautions for each pesticide
- Use Indian pricing (₹) and units (ml, grams, liters)
- Focus on commonly available pesticides in India
- Make damage descriptions specific and recognizable
- Ensure all data is scientifically accurate and practical for farmers

Focus on providing actionable, safe, and effective pest management solutions.`;
  }

  private parsePestDetectionResponse(response: string): PestDetectionResult {
    try {
      console.log('Raw LLM response:', response);
      
      // Clean the response - remove markdown formatting and extra text
      let cleanedResponse = response
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/^[^{]*/, '') // Remove text before first {
        .replace(/[^}]*$/, '') // Remove text after last }
        .trim();

      // Try to find JSON object boundaries more precisely
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
        throw new Error('No valid JSON object found in pest detection response');
      }

      cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
      
      // Fix common JSON issues
      cleanedResponse = cleanedResponse
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([{\[,])\s*(\w+):/g, '$1"$2":') // Quote unquoted keys
        .replace(/:(\s*)([^",{\[\s][^",}\]\s]*?)(\s*[,}\]])/g, ': "$2"$3') // Quote unquoted string values
        .replace(/"\s*:\s*"/g, '": "') // Fix spacing around colons
        .replace(/"\s*,\s*"/g, '", "') // Fix spacing around commas
        .replace(/\n\s*/g, ' ') // Remove newlines and extra spaces
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      console.log('Cleaned JSON:', cleanedResponse);

      const parsed = JSON.parse(cleanedResponse);
      
      // Validate and clean the parsed data
      const result: PestDetectionResult = {
        pest: parsed.pest || 'Unknown Pest',
        confidence: Math.max(0, Math.min(100, parsed.confidence || 85)),
        severity: ['Low', 'Medium', 'High'].includes(parsed.severity) ? parsed.severity : 'Medium',
        description: parsed.description || 'Pest information not available',
        damage: Array.isArray(parsed.damage) ? parsed.damage : ['Damage information not available'],
        pesticides: Array.isArray(parsed.pesticides) ? parsed.pesticides.map((p: any) => ({
          name: p.name || 'Unknown Pesticide',
          activeIngredient: p.activeIngredient || 'Not specified',
          dosage: p.dosage || 'Follow label instructions',
          applicationMethod: p.applicationMethod || 'As directed',
          frequency: p.frequency || 'As needed',
          safetyPrecautions: Array.isArray(p.safetyPrecautions) ? p.safetyPrecautions : ['Follow safety guidelines'],
          effectiveness: Math.max(0, Math.min(100, p.effectiveness || 80)),
          price: p.price || 'Contact supplier'
        })) : []
      };
      
      console.log('Parsed pest detection result:', result);
      return result;
    } catch (error) {
      console.error('Error parsing pest detection LLM response:', error);
      console.log('Response that failed to parse:', response);
      throw error;
    }
  }

  private getFallbackPestData(pestName: string, basePesticides: string[]): PestDetectionResult {
    // Generate fallback data based on pest name
    const pestData: { [key: string]: Partial<PestDetectionResult> } = {
      'Aphids': {
        confidence: 92,
        severity: 'Medium',
        description: 'Small, soft-bodied insects that feed on plant sap, commonly found on new growth and undersides of leaves.',
        damage: [
          'Yellowing and curling of leaves',
          'Stunted plant growth',
          'Honeydew secretion leading to sooty mold',
          'Transmission of plant viruses'
        ]
      },
      'Whiteflies': {
        confidence: 88,
        severity: 'High',
        description: 'Small, white-winged insects that feed on plant sap and can cause significant damage to crops.',
        damage: [
          'Yellowing and wilting of leaves',
          'Reduced plant vigor',
          'Honeydew production',
          'Transmission of viral diseases'
        ]
      },
      'Caterpillars': {
        confidence: 85,
        severity: 'High',
        description: 'Larval stage of moths and butterflies that feed on leaves, causing extensive defoliation.',
        damage: [
          'Holes in leaves and fruits',
          'Complete defoliation in severe cases',
          'Reduced photosynthesis',
          'Entry points for diseases'
        ]
      }
    };

    const baseData = pestData[pestName] || {
      confidence: 85,
      severity: 'Medium',
      description: `Agricultural pest that can cause damage to crops.`,
      damage: [
        'Plant damage and reduced yield',
        'Potential disease transmission',
        'Economic losses for farmers'
      ]
    };

    // Generate pesticides based on base pesticides provided
    const pesticides: Pesticide[] = basePesticides.map((pesticide, index) => {
      const effectiveness = 85 - (index * 5); // Decreasing effectiveness
      return {
        name: pesticide,
        activeIngredient: this.getActiveIngredient(pesticide),
        dosage: this.getDosage(pesticide),
        applicationMethod: this.getApplicationMethod(pesticide),
        frequency: this.getFrequency(pesticide),
        safetyPrecautions: this.getSafetyPrecautions(pesticide),
        effectiveness: Math.max(75, effectiveness),
        price: this.getPrice(pesticide)
      };
    });

    return {
      pest: pestName,
      confidence: baseData.confidence || 85,
      severity: baseData.severity || 'Medium',
      description: baseData.description || 'Pest information not available',
      damage: baseData.damage || ['Damage information not available'],
      pesticides
    };
  }

  private getActiveIngredient(pesticide: string): string {
    const ingredients: { [key: string]: string } = {
      'Neem Oil Spray': 'Azadirachtin',
      'Pyrethrin Insecticide': 'Pyrethrins',
      'Insecticidal Soap': 'Potassium salts of fatty acids',
      'Imidacloprid Systemic': 'Imidacloprid',
      'Spinosad Organic': 'Spinosad',
      'Yellow Sticky Traps': 'Adhesive + Pheromone',
      'Bacillus thuringiensis (Bt)': 'Bacillus thuringiensis',
      'Chlorantraniliprole': 'Chlorantraniliprole',
      'Hand Picking + Neem': 'Manual removal + Azadirachtin'
    };
    return ingredients[pesticide] || 'Active ingredient not specified';
  }

  private getDosage(pesticide: string): string {
    const dosages: { [key: string]: string } = {
      'Neem Oil Spray': '2-4 ml per liter of water',
      'Pyrethrin Insecticide': '1-2 ml per liter of water',
      'Insecticidal Soap': '5-10 ml per liter of water',
      'Imidacloprid Systemic': '1-2 ml per liter of water',
      'Spinosad Organic': '2-4 ml per liter of water',
      'Yellow Sticky Traps': '1 trap per 10 square meters',
      'Bacillus thuringiensis (Bt)': '2-4 grams per liter of water',
      'Chlorantraniliprole': '0.5-1 ml per liter of water',
      'Hand Picking + Neem': '2-3 ml neem per liter water'
    };
    return dosages[pesticide] || 'As per manufacturer instructions';
  }

  private getApplicationMethod(pesticide: string): string {
    const methods: { [key: string]: string } = {
      'Neem Oil Spray': 'Foliar spray, covering all plant surfaces',
      'Pyrethrin Insecticide': 'Direct spray on affected areas',
      'Insecticidal Soap': 'Thoroughly wet all plant surfaces',
      'Imidacloprid Systemic': 'Soil drench or foliar spray',
      'Spinosad Organic': 'Foliar spray covering all surfaces',
      'Yellow Sticky Traps': 'Hang at plant height',
      'Bacillus thuringiensis (Bt)': 'Foliar spray on affected areas',
      'Chlorantraniliprole': 'Foliar spray with good coverage',
      'Hand Picking + Neem': 'Remove pests manually, spray neem'
    };
    return methods[pesticide] || 'Apply as directed';
  }

  private getFrequency(pesticide: string): string {
    const frequencies: { [key: string]: string } = {
      'Neem Oil Spray': 'Every 7-10 days until infestation is controlled',
      'Pyrethrin Insecticide': 'Every 5-7 days, maximum 3 applications',
      'Insecticidal Soap': 'Every 3-5 days as needed',
      'Imidacloprid Systemic': 'Every 14-21 days',
      'Spinosad Organic': 'Every 7-10 days',
      'Yellow Sticky Traps': 'Replace every 2-3 weeks',
      'Bacillus thuringiensis (Bt)': 'Every 7-10 days',
      'Chlorantraniliprole': 'Every 14-21 days',
      'Hand Picking + Neem': 'Daily inspection, spray every 3-5 days'
    };
    return frequencies[pesticide] || 'As needed';
  }

  private getSafetyPrecautions(pesticide: string): string[] {
    const precautions: { [key: string]: string[] } = {
      'Neem Oil Spray': [
        'Apply in early morning or late evening',
        'Avoid spraying during flowering',
        'Wear protective clothing',
        'Keep away from children and pets'
      ],
      'Pyrethrin Insecticide': [
        'Do not apply in direct sunlight',
        'Wait 24 hours before harvest',
        'Use protective equipment',
        'Store in cool, dry place'
      ],
      'Insecticidal Soap': [
        'Test on small area first',
        'Apply when temperature is below 30°C',
        'Rinse with water after 2 hours',
        'Avoid contact with eyes'
      ],
      'Imidacloprid Systemic': [
        'Do not apply near water bodies',
        'Wait 21 days before harvest',
        'Use protective equipment',
        'Keep away from beneficial insects'
      ],
      'Spinosad Organic': [
        'Apply in evening hours',
        'Safe for beneficial insects',
        'Wait 1 day before harvest',
        'Store below 30°C'
      ],
      'Yellow Sticky Traps': [
        'Position away from beneficial insects',
        'Check traps regularly',
        'Dispose of used traps properly',
        'Keep out of reach of children'
      ],
      'Bacillus thuringiensis (Bt)': [
        'Apply in evening for best results',
        'Safe for beneficial insects',
        'Store in refrigerator',
        'Use within 2 years of purchase'
      ],
      'Chlorantraniliprole': [
        'Do not apply in windy conditions',
        'Wait 14 days before harvest',
        'Use protective equipment',
        'Avoid contact with skin'
      ],
      'Hand Picking + Neem': [
        'Wear gloves when hand picking',
        'Apply neem in evening',
        'Dispose of pests safely',
        'Monitor regularly'
      ]
    };
    return precautions[pesticide] || [
      'Read label instructions carefully',
      'Use protective equipment',
      'Keep away from children and pets',
      'Store in original container'
    ];
  }

  private getPrice(pesticide: string): string {
    const prices: { [key: string]: string } = {
      'Neem Oil Spray': '₹200-300 per 100ml',
      'Pyrethrin Insecticide': '₹150-250 per 50ml',
      'Insecticidal Soap': '₹100-150 per 500ml',
      'Imidacloprid Systemic': '₹300-500 per 100ml',
      'Spinosad Organic': '₹250-400 per 100ml',
      'Yellow Sticky Traps': '₹50-100 per trap',
      'Bacillus thuringiensis (Bt)': '₹200-350 per 100g',
      'Chlorantraniliprole': '₹400-600 per 50ml',
      'Hand Picking + Neem': '₹150-250 per 100ml neem'
    };
    return prices[pesticide] || '₹200-400 per unit';
  }

  async generateCropRecommendations(request: CropRecommendationRequest): Promise<CropRecommendation[]> {
    try {
      console.log('Generating crop recommendations with LLM...');
      console.log('Request:', request);
      
      // Check if API key is configured
      if (this.EXPO_PUBLIC_GEMINI_API_KEY === 'your_gemini_api_key_here' || !this.EXPO_PUBLIC_GEMINI_API_KEY) {
        console.log('Gemini API key not configured, using fallback crop recommendations');
        return this.getFallbackCropRecommendations(request);
      }
      
      const prompt = this.createCropRecommendationPrompt(request);
      console.log('Crop recommendation prompt created, calling Gemini API...');
      const response = await this.callGeminiAPI(prompt);
      console.log('Gemini API response received for crop recommendations');
      
      return this.parseCropRecommendationResponse(response);
    } catch (error) {
      console.error('Error generating crop recommendations:', error);
      console.log('Falling back to rule-based crop recommendations');
      return this.getFallbackCropRecommendations(request);
    }
  }

  private createCropRecommendationPrompt(request: CropRecommendationRequest): string {
    const locationInfo = request.location.coordinates 
      ? `Location: ${request.location.name} (${request.location.coordinates.latitude}, ${request.location.coordinates.longitude})`
      : `Location: ${request.location.name}`;
    
    const stateDistrict = request.location.state && request.location.district 
      ? `State: ${request.location.state}, District: ${request.location.district}`
      : '';

    return `You are an expert agricultural consultant specializing in crop recommendations for Indian farmers. Generate the top 3 most suitable crop recommendations based on the following parameters:

FARMING PARAMETERS:
- Season: ${request.season}
- Soil Type: ${request.soilType}
- ${locationInfo}
${stateDistrict ? `- ${stateDistrict}` : ''}
${request.preferences ? `
FARMER PREFERENCES:
- Water Availability: ${request.preferences.waterAvailability}
- Budget: ${request.preferences.budget}
- Experience Level: ${request.preferences.experience}
- Farm Size: ${request.preferences.farmSize}
` : ''}

Please provide exactly 3 crop recommendations that are:
1. Highly suitable for the specified season and soil type
2. Appropriate for the location and climate
3. Considerate of farmer preferences (if provided)
4. Realistic in terms of yield, profit, and requirements
5. Include popular Indian crop varieties

Format your response as JSON:
{
  "recommendations": [
    {
      "id": 1,
      "name": "Crop Name",
      "variety": "Specific variety name",
      "suitability": 85-95,
      "yield": "X-Y tons/hectare",
      "profit": "₹X-Y per hectare",
      "duration": "X-Y days/months",
      "water": "High|Medium|Low",
      "sustainability": 6.0-9.0,
      "image": "🌾|🌽|🥔|🍅|🌶️|🥬|🌿|🌱",
      "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
      "requirements": ["Requirement 1", "Requirement 2", "Requirement 3"],
      "marketDemand": "High|Medium|Low",
      "riskLevel": "Low|Medium|High",
      "bestPlantingTime": "Specific time period",
      "expectedROI": "X-Y%"
    },
    {
      "id": 2,
      "name": "Crop Name",
      "variety": "Specific variety name",
      "suitability": 85-95,
      "yield": "X-Y tons/hectare",
      "profit": "₹X-Y per hectare",
      "duration": "X-Y days/months",
      "water": "High|Medium|Low",
      "sustainability": 6.0-9.0,
      "image": "🌾|🌽|🥔|🍅|🌶️|🥬|🌿|🌱",
      "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
      "requirements": ["Requirement 1", "Requirement 2", "Requirement 3"],
      "marketDemand": "High|Medium|Low",
      "riskLevel": "Low|Medium|High",
      "bestPlantingTime": "Specific time period",
      "expectedROI": "X-Y%"
    },
    {
      "id": 3,
      "name": "Crop Name",
      "variety": "Specific variety name",
      "suitability": 85-95,
      "yield": "X-Y tons/hectare",
      "profit": "₹X-Y per hectare",
      "duration": "X-Y days/months",
      "water": "High|Medium|Low",
      "sustainability": 6.0-9.0,
      "image": "🌾|🌽|🥔|🍅|🌶️|🥬|🌿|🌱",
      "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
      "requirements": ["Requirement 1", "Requirement 2", "Requirement 3"],
      "marketDemand": "High|Medium|Low",
      "riskLevel": "Low|Medium|High",
      "bestPlantingTime": "Specific time period",
      "expectedROI": "X-Y%"
    }
  ]
}

IMPORTANT GUIDELINES:
- Focus on crops commonly grown in India
- Consider seasonal timing and climate suitability
- Provide realistic yield and profit estimates
- Include popular Indian crop varieties
- Make recommendations practical and actionable
- Consider water requirements based on location
- Factor in market demand and risk levels
- Use appropriate emojis for crop types
- Ensure all data is scientifically accurate and region-appropriate

Prioritize crops that are most suitable for the given conditions and farmer preferences.`;
  }

  private parseCropRecommendationResponse(response: string): CropRecommendation[] {
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in crop recommendation response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
        return parsed.recommendations.map((crop: any, index: number) => ({
          id: crop.id || index + 1,
          name: crop.name || 'Unknown Crop',
          variety: crop.variety || 'Standard Variety',
          suitability: crop.suitability || 85,
          yield: crop.yield || 'Data not available',
          profit: crop.profit || '₹0-0',
          duration: crop.duration || 'Unknown',
          water: crop.water || 'Medium',
          sustainability: crop.sustainability || 7.0,
          image: crop.image || '🌾',
          benefits: crop.benefits || ['Good yield potential'],
          requirements: crop.requirements || ['Standard farming practices'],
          marketDemand: crop.marketDemand || 'Medium',
          riskLevel: crop.riskLevel || 'Medium',
          bestPlantingTime: crop.bestPlantingTime || 'Season dependent',
          expectedROI: crop.expectedROI || '15-25%'
        }));
      }

      return [];
    } catch (error) {
      console.error('Error parsing crop recommendation LLM response:', error);
      throw error;
    }
  }

  private getFallbackCropRecommendations(request: CropRecommendationRequest): CropRecommendation[] {
    // Generate fallback recommendations based on season and soil type
    const seasonCrops: { [key: string]: Partial<CropRecommendation>[] } = {
      'kharif': [
        {
          name: 'Rice',
          variety: 'Basmati 370',
          suitability: 95,
          yield: '4.5-5.5 tons/hectare',
          profit: '₹45,000-55,000',
          duration: '120-140 days',
          water: 'High',
          sustainability: 8.5,
          image: '🌾',
          benefits: ['High market demand', 'Good for export', 'Drought resistant variety'],
          requirements: ['Well-drained soil', 'Consistent irrigation', 'Fertile soil'],
          marketDemand: 'High',
          riskLevel: 'Low',
          bestPlantingTime: 'June-July',
          expectedROI: '20-25%'
        },
        {
          name: 'Maize',
          variety: 'Hybrid 900M Gold',
          suitability: 88,
          yield: '6-8 tons/hectare',
          profit: '₹35,000-45,000',
          duration: '90-110 days',
          water: 'Medium',
          sustainability: 7.5,
          image: '🌽',
          benefits: ['High yield potential', 'Good for animal feed', 'Short duration'],
          requirements: ['Well-drained soil', 'Adequate sunlight', 'Regular irrigation'],
          marketDemand: 'High',
          riskLevel: 'Medium',
          bestPlantingTime: 'June-July',
          expectedROI: '18-22%'
        },
        {
          name: 'Cotton',
          variety: 'Bt Cotton',
          suitability: 85,
          yield: '15-20 quintals/hectare',
          profit: '₹60,000-80,000',
          duration: '150-180 days',
          water: 'Medium',
          sustainability: 6.5,
          image: '🌿',
          benefits: ['High value crop', 'Export potential', 'Multiple uses'],
          requirements: ['Deep soil', 'Warm climate', 'Pest management'],
          marketDemand: 'High',
          riskLevel: 'High',
          bestPlantingTime: 'May-June',
          expectedROI: '25-30%'
        }
      ],
      'rabi': [
        {
          name: 'Wheat',
          variety: 'HD-2967',
          suitability: 92,
          yield: '3.5-4.2 tons/hectare',
          profit: '₹35,000-42,000',
          duration: '110-125 days',
          water: 'Medium',
          sustainability: 7.8,
          image: '🌾',
          benefits: ['High protein content', 'Good for domestic market', 'Easy to grow'],
          requirements: ['Well-drained soil', 'Cool climate', 'Adequate sunlight'],
          marketDemand: 'High',
          riskLevel: 'Low',
          bestPlantingTime: 'November-December',
          expectedROI: '15-20%'
        },
        {
          name: 'Mustard',
          variety: 'Pusa Bold',
          suitability: 88,
          yield: '2-3 tons/hectare',
          profit: '₹25,000-35,000',
          duration: '100-120 days',
          water: 'Low',
          sustainability: 8.0,
          image: '🌿',
          benefits: ['Oil production', 'Low water requirement', 'Good for rotation'],
          requirements: ['Well-drained soil', 'Cool climate', 'Minimal irrigation'],
          marketDemand: 'Medium',
          riskLevel: 'Low',
          bestPlantingTime: 'October-November',
          expectedROI: '12-18%'
        },
        {
          name: 'Chickpea',
          variety: 'Pusa 256',
          suitability: 85,
          yield: '1.5-2 tons/hectare',
          profit: '₹30,000-40,000',
          duration: '120-140 days',
          water: 'Low',
          sustainability: 8.5,
          image: '🌱',
          benefits: ['High protein', 'Nitrogen fixation', 'Drought tolerant'],
          requirements: ['Well-drained soil', 'Cool climate', 'Minimal irrigation'],
          marketDemand: 'High',
          riskLevel: 'Low',
          bestPlantingTime: 'October-November',
          expectedROI: '18-25%'
        }
      ],
      'zaid': [
        {
          name: 'Cucumber',
          variety: 'Pusa Sanyog',
          suitability: 90,
          yield: '15-20 tons/hectare',
          profit: '₹40,000-60,000',
          duration: '60-80 days',
          water: 'High',
          sustainability: 7.0,
          image: '🥒',
          benefits: ['High yield', 'Quick returns', 'Good market demand'],
          requirements: ['Fertile soil', 'Regular irrigation', 'Trellis support'],
          marketDemand: 'High',
          riskLevel: 'Medium',
          bestPlantingTime: 'March-April',
          expectedROI: '20-30%'
        },
        {
          name: 'Bottle Gourd',
          variety: 'Pusa Naveen',
          suitability: 88,
          yield: '20-25 tons/hectare',
          profit: '₹35,000-50,000',
          duration: '70-90 days',
          water: 'High',
          sustainability: 7.5,
          image: '🥒',
          benefits: ['High yield', 'Easy to grow', 'Good for health'],
          requirements: ['Fertile soil', 'Regular irrigation', 'Support structure'],
          marketDemand: 'Medium',
          riskLevel: 'Low',
          bestPlantingTime: 'March-April',
          expectedROI: '18-25%'
        },
        {
          name: 'Okra',
          variety: 'Pusa Sawani',
          suitability: 85,
          yield: '8-12 tons/hectare',
          profit: '₹30,000-45,000',
          duration: '80-100 days',
          water: 'Medium',
          sustainability: 7.2,
          image: '🌶️',
          benefits: ['Continuous harvest', 'High nutrition', 'Good market price'],
          requirements: ['Well-drained soil', 'Regular irrigation', 'Pest management'],
          marketDemand: 'High',
          riskLevel: 'Medium',
          bestPlantingTime: 'March-April',
          expectedROI: '22-28%'
        }
      ]
    };

    const crops = seasonCrops[request.season] || seasonCrops['kharif'];
    
    return crops.map((crop, index) => ({
      id: index + 1,
      name: crop.name || 'Unknown Crop',
      variety: crop.variety || 'Standard Variety',
      suitability: crop.suitability || 85,
      yield: crop.yield || 'Data not available',
      profit: crop.profit || '₹0-0',
      duration: crop.duration || 'Unknown',
      water: crop.water || 'Medium',
      sustainability: crop.sustainability || 7.0,
      image: crop.image || '🌾',
      benefits: crop.benefits || ['Good yield potential'],
      requirements: crop.requirements || ['Standard farming practices'],
      marketDemand: crop.marketDemand || 'Medium',
      riskLevel: crop.riskLevel || 'Medium',
      bestPlantingTime: crop.bestPlantingTime || 'Season dependent',
      expectedROI: crop.expectedROI || '15-25%'
    }));
  }

  getFallbackInsights(weatherData: ProcessedWeatherData[]): WeatherInsights {
    const currentWeather = weatherData[0];
    const alerts: WeatherAlert[] = [];
    const farmingTips: FarmingTip[] = [];

    // Generate alerts based on weather conditions
    if (currentWeather.rain > 20) {
      alerts.push({
        type: 'warning',
        title: 'Heavy Rain Alert',
        message: `Heavy rainfall expected (${currentWeather.rain}mm). Avoid field work and check drainage systems.`,
        time: 'Just now',
        priority: 'high'
      });
    }

    if (currentWeather.temp.low < 5) {
      alerts.push({
        type: 'info',
        title: 'Temperature Drop',
        message: `Temperature will drop to ${currentWeather.temp.low}°C. Protect sensitive crops.`,
        time: '1 hour ago',
        priority: 'medium'
      });
    }

    if (currentWeather.wind > 20) {
      alerts.push({
        type: 'warning',
        title: 'High Wind Warning',
        message: `Strong winds expected (${currentWeather.wind} km/h). Avoid spraying and check for crop damage.`,
        time: '30 minutes ago',
        priority: 'high'
      });
    }

    // Generate farming tips based on weather conditions
    if (currentWeather.rain > 10) {
      farmingTips.push({
        condition: 'Rainy Weather',
        tips: [
          'Avoid spraying pesticides during rain',
          'Check and clear drainage systems',
          'Monitor for waterlogging',
          'Postpone harvesting activities'
        ],
        priority: 'high'
      });
    }

    if (currentWeather.temp.high > 30) {
      farmingTips.push({
        condition: 'Hot Weather',
        tips: [
          'Increase irrigation frequency',
          'Provide shade for sensitive crops',
          'Water early morning or evening',
          'Monitor soil moisture levels'
        ],
        priority: 'high'
      });
    }

    if (currentWeather.wind > 15) {
      farmingTips.push({
        condition: 'Windy Weather',
        tips: [
          'Avoid spraying in strong winds',
          'Check for crop damage',
          'Secure greenhouse structures',
          'Monitor for pest spread'
        ],
        priority: 'medium'
      });
    }

    // Default tips if no specific conditions
    if (farmingTips.length === 0) {
      farmingTips.push({
        condition: 'General Farming',
        tips: [
          'Monitor soil moisture levels',
          'Check for pest and disease signs',
          'Plan irrigation schedule',
          'Prepare for upcoming weather changes'
        ],
        priority: 'low'
      });
    }

    return {
      alerts,
      farmingTips,
      generalAdvice: `Current conditions are ${currentWeather.condition.toLowerCase()} with temperatures ranging from ${currentWeather.temp.low}°C to ${currentWeather.temp.high}°C. ${currentWeather.description}`
    };
  }
}

export const llmService = LLMService.getInstance();
