import Constants from 'expo-constants';

export interface PestDetectionApiResponse {
  pestName: string;
  pesticides: string[];
}

class PestApiService {
  private static instance: PestApiService;
  private readonly API_BASE_URL = Constants.expoConfig?.extra?.fastapiApiUrl || process.env.EXPO_PUBLIC_FASTAPI_API_URL || 'http://localhost:8000/api';

  static getInstance(): PestApiService {
    if (!PestApiService.instance) {
      PestApiService.instance = new PestApiService();
    }
    return PestApiService.instance;
  }

  async detectPest(imageUri: string): Promise<PestDetectionApiResponse> {
    try {
      console.log('Calling pest detection API...');
      console.log('API URL:', `${this.API_BASE_URL}/pest/detect`);
      
      // Handle different platforms for file upload
      const formData = new FormData();
      
      // Check if we're on web platform
      if (typeof window !== 'undefined' && window.location) {
        // Web platform - convert URI to blob
        console.log('Web platform detected, converting image to blob...');
        
        // Convert URI to blob for web platform
        const response = await fetch(imageUri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        const blob = await response.blob();
        console.log('Blob created:', blob.size, 'bytes, type:', blob.type);
        formData.append('image', blob, 'pest_image.jpg');
      } else {
        // React Native platform
        console.log('React Native platform detected, using URI...');
        formData.append('image', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'pest_image.jpg',
        } as any);
      }

      console.log('FormData prepared, sending request...');
      
      // Debug FormData contents
      if (typeof window !== 'undefined' && window.location) {
        console.log('FormData entries:');
        try {
          for (const [key, value] of (formData as any).entries()) {
            console.log(`  ${key}:`, value);
          }
        } catch (e) {
          console.log('  FormData debugging not available');
        }
      }

      const apiResponse = await fetch(`${this.API_BASE_URL}/pest/detect`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let the browser set it with boundary
        mode: 'cors', // Enable CORS for web requests
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('API error response:', errorText);
        console.error('Response headers:', Object.fromEntries(apiResponse.headers.entries()));
        console.error('Request details:', {
          url: `${this.API_BASE_URL}/pest/detect`,
          method: 'POST',
          bodyType: 'FormData',
          fieldName: 'image'
        });
        throw new Error(`API error: ${apiResponse.status} - ${errorText}`);
      }

      const responseText = await apiResponse.text();
      console.log('Raw API response:', responseText);
      
      // Parse the response text to extract pest name and pesticides
      const parsedResponse = this.parseApiResponse(responseText);
      console.log('Parsed API response:', parsedResponse);
      
      return parsedResponse;
    } catch (error) {
      console.error('Error calling pest detection API:', error);
      throw error;
    }
  }

  private parseApiResponse(responseText: string): PestDetectionApiResponse {
    try {
      // Split the response into lines and clean them
      const lines = responseText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      let pestName = '';
      const pesticides: string[] = [];

      // Find the pest name line
      const pestLine = lines.find(line => line.toLowerCase().includes('pest detected:'));
      if (pestLine) {
        // Extract pest name after "Pest Detected:"
        const match = pestLine.match(/pest detected:\s*(.+)/i);
        if (match) {
          pestName = match[1].trim();
        }
      }

      // Find pesticide lines
      let foundPesticideSection = false;
      for (const line of lines) {
        if (line.toLowerCase().includes('recommended pesticides:')) {
          foundPesticideSection = true;
          continue;
        }
        
        if (foundPesticideSection) {
          // Look for numbered pesticide entries (1. 2. 3.)
          const pesticideMatch = line.match(/^\d+\.\s*(.+)$/);
          if (pesticideMatch) {
            pesticides.push(pesticideMatch[1].trim());
          }
        }
      }

      // Fallback parsing if the above doesn't work
      if (!pestName || pesticides.length === 0) {
        console.log('Using fallback parsing...');
        
        // Try to find pest name in any line
        for (const line of lines) {
          if (line.toLowerCase().includes('midge') || 
              line.toLowerCase().includes('aphid') || 
              line.toLowerCase().includes('whitefly') ||
              line.toLowerCase().includes('caterpillar') ||
              line.toLowerCase().includes('bug') ||
              line.toLowerCase().includes('pest')) {
            pestName = line.toLowerCase().replace(/pest detected:\s*/i, '').trim();
            break;
          }
        }

        // Try to find any pesticide names
        const pesticideKeywords = ['malathion', 'dimethoate', 'lambda', 'cyhalothrin', 'neem', 'pyrethrin', 'imidacloprid'];
        for (const line of lines) {
          for (const keyword of pesticideKeywords) {
            if (line.toLowerCase().includes(keyword)) {
              pesticides.push(line.trim());
            }
          }
        }
      }

      // Ensure we have at least some data
      if (!pestName) {
        pestName = 'Unknown Pest';
      }

      if (pesticides.length === 0) {
        pesticides.push('Neem Oil Spray', 'Pyrethrin Insecticide', 'Insecticidal Soap');
      }

      console.log('Final parsed result:', { pestName, pesticides });

      return {
        pestName,
        pesticides: pesticides.slice(0, 3) // Ensure we only return 3 pesticides
      };
    } catch (error) {
      console.error('Error parsing API response:', error);
      throw new Error('Failed to parse API response');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing API connection to:', `${this.API_BASE_URL}/health`);
      const response = await fetch(`${this.API_BASE_URL}/health`, {
        method: 'GET',
        mode: 'cors',
      });
      console.log('Health check response:', response.status, response.statusText);
      return response.ok;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  async testPestDetectionEndpoint(): Promise<boolean> {
    try {
      console.log('Testing pest detection endpoint...');
      
      // Create a simple test blob (1x1 pixel PNG)
      const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const response = await fetch(testImageData);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('image', blob, 'test.png');
      
      const apiResponse = await fetch(`${this.API_BASE_URL}/pest/detect`, {
        method: 'POST',
        body: formData,
        mode: 'cors',
      });
      
      console.log('Pest detection test response:', apiResponse.status, apiResponse.statusText);
      
      if (apiResponse.ok) {
        const responseText = await apiResponse.text();
        console.log('Test response content:', responseText);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Pest detection endpoint test failed:', error);
      return false;
    }
  }
}

export const pestApiService = PestApiService.getInstance();
