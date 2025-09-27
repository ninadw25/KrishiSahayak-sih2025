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

class ChatApiService {
  private static instance: ChatApiService;
  private readonly API_BASE_URL = Constants.expoConfig?.extra?.fastapiApiUrl || process.env.EXPO_PUBLIC_FASTAPI_API_URL || 'http://localhost:8000/api';

  static getInstance(): ChatApiService {
    if (!ChatApiService.instance) {
      ChatApiService.instance = new ChatApiService();
    }
    return ChatApiService.instance;
  }

  async sendMessage(
    message: string, 
    conversationHistory: ChatMessage[] = [], 
    imageUri?: string
  ): Promise<ChatApiResponse> {
    try {
      console.log('Sending message to chat API...');
      console.log('Message:', message);
      console.log('Has image:', !!imageUri);
      console.log('Conversation history length:', conversationHistory.length);
      
      const requestBody: ChatApiRequest = {
        message,
        conversation_history: conversationHistory,
        image_uri: imageUri
      };

      const response = await fetch(`${this.API_BASE_URL}/agent/agent/chat`, {
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
