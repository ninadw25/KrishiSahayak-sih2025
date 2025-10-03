import Constants from 'expo-constants';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  imageUri?: string;
}

export interface ChatApiRequest {
  message: string;
  conversation_history?: ChatMessage[];
  image_uri?: string;
}

export interface ChatApiResponse {
  response: string;
  conversation_id?: string;
  suggestions?: string[];
}

export interface FertilizerRequest {
  N: number;
  P: number;
  K: number;
  ph: number;
  crop: string;
}

export interface FertilizerResponse {
  fertilizer: string;
  dosage: number;
  updated_soil: {
    N: number;
    P: number;
    K: number;
    ph: number;
  };
}

class ChatApiService {
  private static instance: ChatApiService;
  private readonly API_BASE_URL = 'http://localhost:8000/api';  // Force localhost

  static getInstance(): ChatApiService {
    if (!ChatApiService.instance) {
      ChatApiService.instance = new ChatApiService();
    }
    return ChatApiService.instance;
  }

  // Helper function to normalize crop names for fertilizer API
  private normalizeCropName(cropName: string): string {
    const name = cropName.toLowerCase().trim();
    
    // Map of display names to API names
    const cropMapping: { [key: string]: string } = {
      // Handle parenthetical names
      'pearl millet (bajra)': 'bajra',
      'finger millet (ragi)': 'ragi',
      'sorghum (jowar)': 'jowar',
      'black gram (urad)': 'urad',
      'green gram (moong)': 'moonggreen_gram',
      'bengal gram (chana)': 'gram',
      'pigeon pea (arhar)': 'arhartur',
      'red gram (tur)': 'arhartur',
      
      // Common variations
      'rice': 'rice',
      'wheat': 'wheat',
      'maize': 'maize',
      'corn': 'maize',
      'bajra': 'bajra',
      'jowar': 'jowar',
      'ragi': 'ragi',
      'barley': 'barley',
      'sugarcane': 'sugarcane',
      'cotton': 'cottonlint',
      'groundnut': 'groundnut',
      'peanut': 'groundnut',
      'soybean': 'soyabean',
      'soya': 'soyabean',
      'mustard': 'rapeseed_mustard',
      'rapeseed': 'rapeseed_mustard',
      'sunflower': 'sunflower',
      'safflower': 'safflower',
      'sesame': 'sesamum',
      'til': 'sesamum',
      'potato': 'potato',
      'onion': 'onion',
      'tomato': 'tomato',
      'brinjal': 'brinjal',
      'eggplant': 'brinjal',
      'okra': 'bhindi',
      'bhindi': 'bhindi',
      'cabbage': 'cabbage',
      'cauliflower': 'cauliflower',
      'carrot': 'carrot',
      'radish': 'redish',
      'turnip': 'turnip',
      'banana': 'banana',
      'mango': 'mango',
      'apple': 'apple',
      'grapes': 'grapes',
      'orange': 'orange',
      'citrus': 'citrus_fruit',
      'coconut': 'coconut',
      'tea': 'tea',
      'coffee': 'coffee',
      'rubber': 'rubber',
      'tobacco': 'tobacco',
      'jute': 'jute_mesta',
      'turmeric': 'turmeric',
      'ginger': 'ginger',
      'garlic': 'garlic',
      'coriander': 'coriander',
      'cumin': 'coriander',
      'chili': 'dry_chillies',
      'chilli': 'dry_chillies',
      'pepper': 'dry_chillies'
    };

    // First, try direct mapping
    if (cropMapping[name]) {
      return cropMapping[name];
    }

    // Extract crop name from parentheses if present
    const parenthesesMatch = name.match(/\(([^)]+)\)/);
    if (parenthesesMatch) {
      const extractedName = parenthesesMatch[1].toLowerCase();
      if (cropMapping[extractedName]) {
        return cropMapping[extractedName];
      }
    }

    // Extract main crop name before parentheses
    const beforeParentheses = name.split('(')[0].trim();
    if (cropMapping[beforeParentheses]) {
      return cropMapping[beforeParentheses];
    }

    // Check if any keyword is contained in the name
    for (const [key, value] of Object.entries(cropMapping)) {
      if (name.includes(key) || key.includes(name)) {
        return value;
      }
    }

    // If no mapping found, clean up the name
    return name
      .replace(/\([^)]*\)/g, '') // Remove parentheses and content
      .replace(/[^a-z0-9]/g, '_') // Replace non-alphanumeric with underscore
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
  }

  async sendMessage(
    message: string, 
    conversationHistory: ChatMessage[] = [], 
    imageUri?: string
  ): Promise<ChatApiResponse> {
    try {
      console.log('API_BASE_URL:', this.API_BASE_URL);
      console.log('Full URL:', `${this.API_BASE_URL}/agent/chat`);
      console.log('Sending message to chat API...');
      console.log('Message:', message);
      console.log('Has image:', !!imageUri);
      console.log('Conversation history length:', conversationHistory.length);
      
      const requestBody: ChatApiRequest = {
        message,
        conversation_history: conversationHistory,
        image_uri: imageUri
      };

      const response = await fetch(`${this.API_BASE_URL}/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        mode: 'cors',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Chat API error response:', errorText);
        console.error('Response headers:', Object.fromEntries(response.headers.entries()));
        throw new Error(`Chat API error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log('Chat API response:', responseData);
      
      return {
        response: responseData.response || responseData.message || 'No response received',
        conversation_id: responseData.conversation_id,
        suggestions: responseData.suggestions || []
      };
    } catch (error) {
      console.error('Error calling chat API:', error);
      throw error;
    }
  }

  async sendImageAnalysis(imageUri: string, analysisMessage: string): Promise<ChatApiResponse> {
    try {
      console.log('Sending image analysis to chat API...');
      console.log('Image URI:', imageUri);
      console.log('Analysis message:', analysisMessage);
      
      const requestBody: ChatApiRequest = {
        message: analysisMessage,
        image_uri: imageUri,
        conversation_history: []
      };

      const response = await fetch(`${this.API_BASE_URL}/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        mode: 'cors',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Image analysis API error:', errorText);
        throw new Error(`Image analysis API error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log('Image analysis API response:', responseData);
      
      return {
        response: responseData.response || responseData.message || 'Image analysis failed',
        conversation_id: responseData.conversation_id,
        suggestions: responseData.suggestions || []
      };
    } catch (error) {
      console.error('Error calling image analysis API:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing chat API connection...');
      const response = await fetch(`${this.API_BASE_URL}/health`, {
        method: 'GET',
        mode: 'cors',
      });
      console.log('Health check response:', response.status, response.statusText);
      return response.ok;
    } catch (error) {
      console.error('Chat API connection test failed:', error);
      return false;
    }
  }

  async getFertilizerRecommendation(N: number, P: number, K: number, ph: number, crop: string): Promise<FertilizerResponse> {
    try {
      console.log('Getting fertilizer recommendation...');
      
      // Normalize the crop name for the API
      const normalizedCrop = this.normalizeCropName(crop);
      console.log('Original crop:', crop, '-> Normalized crop:', normalizedCrop);
      console.log('Input:', { N, P, K, ph, crop: normalizedCrop });
      
      const requestBody: FertilizerRequest = {
        N,
        P,
        K,
        ph,
        crop: normalizedCrop
      };

      const response = await fetch(`${this.API_BASE_URL}/fertilizer_recommender`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        mode: 'cors',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fertilizer API error response:', errorText);
        throw new Error(`Fertilizer API error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log('Fertilizer API response:', responseData);
      
      return responseData;
    } catch (error) {
      console.error('Error calling fertilizer API:', error);
      throw error;
    }
  }

  async testChatEndpoint(): Promise<boolean> {
    try {
      console.log('Testing chat endpoint...');
      
      const testMessage: ChatApiRequest = {
        message: 'Hello, this is a test message',
        conversation_history: []
      };
      
      const response = await fetch(`${this.API_BASE_URL}/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessage),
        mode: 'cors',
      });
      
      console.log('Chat endpoint test response:', response.status, response.statusText);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Test response content:', responseData);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Chat endpoint test failed:', error);
      return false;
    }
  }

  // Helper method to convert internal message format to API format
  convertMessagesToApiFormat(messages: Array<{ text: string; isUser: boolean; timestamp: Date; imageUri?: string }>): ChatMessage[] {
    return messages
      .filter(msg => msg.text.trim() !== '') // Filter out empty messages
      .map(msg => ({
        role: msg.isUser ? 'user' : 'assistant' as 'user' | 'assistant',
        content: msg.text,
        timestamp: msg.timestamp,
        imageUri: msg.imageUri
      }))
      .slice(-10); // Keep only last 10 messages to avoid token limits
  }
}

export const chatApiService = ChatApiService.getInstance();
