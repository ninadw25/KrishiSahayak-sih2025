import { geocodingService } from './geocodingService';

export interface MarketPriceRecord {
  State: string;
  District: string;
  Market: string;
  Commodity: string;
  Variety: string;
  Grade: string;
  Arrival_Date: string;
  Min_Price: string;
  Max_Price: string;
  Modal_Price: string;
  Commodity_Code: string;
}

// API response interface for the actual API structure
export interface ApiMarketRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  arrival_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  commodity_code: string;
}

export interface MarketPriceResponse {
  total: number;
  count: number;
  records: MarketPriceRecord[];
}

export interface ProcessedMarketData {
  commodity: string;
  variety: string;
  grade: string;
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  averagePrice: number;
  priceChange: number;
  priceChangePercent: number;
  trend: 'up' | 'down' | 'stable';
  demand: 'Low' | 'Medium' | 'High' | 'Very High';
  supply: 'Low' | 'Medium' | 'High' | 'Very High';
  forecast: string;
  lastUpdated: string;
  marketCount: number;
  priceHistory: PriceHistoryPoint[];
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
  month: string;
}

export interface MarketInsights {
  location: {
    state: string;
    district: string;
    displayName: string;
  };
  commodities: ProcessedMarketData[];
  marketNews: MarketNewsItem[];
  marketFactors: MarketFactor[];
  generalAdvice: string;
  dataSource?: string;
}

export interface MarketNewsItem {
  title: string;
  summary: string;
  impact: 'Positive' | 'Negative' | 'Neutral';
  time: string;
  source: string;
}

export interface MarketFactor {
  factor: string;
  impact: 'Positive' | 'Negative' | 'Neutral';
  description: string;
  icon: string;
}

class MarketService {
  private static instance: MarketService;
  private readonly API_KEY = '579b464db66ec23bdd00000175ba189d3b1e4479741c4953b1e7ef04';
  private readonly RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
  private readonly BASE_URL = 'https://api.data.gov.in/resource';

  static getInstance(): MarketService {
    if (!MarketService.instance) {
      MarketService.instance = new MarketService();
    }
    return MarketService.instance;
  }

  async getMarketInsights(): Promise<MarketInsights> {
    try {
      console.log('Getting market insights...');
      
      // Test API connection first
      await this.testApiConnection();
      
      // Get current location
      const locationResult = await geocodingService.getLocationFromCurrentPosition();
      if (!locationResult.success || !locationResult.data) {
        throw new Error('Failed to get location data');
      }

      const location = locationResult.data;
      const { state, district } = geocodingService.getStateAndDistrict(location);

      console.log('Location data:', { state, district });

      // Try to get market data for the specific location first
      let marketData = await this.getMarketData(state, district);
      
      // If no data found for specific district, try state-wide data
      if (!marketData || marketData.length === 0) {
        console.log('No data for specific district, trying state-wide data...');
        marketData = await this.getMarketData(state, '');
      }
      
      // If still no data, try with common states
      if (!marketData || marketData.length === 0) {
        console.log('No data for state, trying common states...');
        const commonStates = ['Maharashtra', 'Punjab', 'Haryana', 'Uttar Pradesh', 'Karnataka'];
        for (const commonState of commonStates) {
          marketData = await this.getMarketData(commonState, '');
          if (marketData && marketData.length > 0) {
            console.log(`Found data for ${commonState}`);
            break;
          }
        }
      }

      // If still no data, try without any filters to get any available data
      if (!marketData || marketData.length === 0) {
        console.log('No data found with filters, trying without filters...');
        marketData = await this.getMarketDataWithoutFilters();
      }

      // If still no data, try to get recent data from any state
      if (!marketData || marketData.length === 0) {
        console.log('No data found, trying to get recent data from any state...');
        marketData = await this.getRecentMarketData();
      }

      // If still no data, try with different API parameters
      if (!marketData || marketData.length === 0) {
        console.log('No data found, trying with different API parameters...');
        marketData = await this.getMarketDataWithAlternativeParams(state, district);
      }

      // If still no data, try with a different API endpoint
      if (!marketData || marketData.length === 0) {
        console.log('No data found, trying with different API endpoint...');
        marketData = await this.getMarketDataFromAlternativeEndpoint(state, district);
      }

      // If still no data, try with pagination approach
      if (!marketData || marketData.length === 0) {
        console.log('No data found, trying with pagination approach...');
        marketData = await this.getMarketDataWithPagination(state, district);
      }

      // If still no data, try with a different resource ID
      if (!marketData || marketData.length === 0) {
        console.log('No data found, trying with different resource ID...');
        marketData = await this.getMarketDataWithDifferentResource(state, district);
      }
      
      // Filter for recent data (last 3 months) and process
      const recentData = this.filterRecentRecords(marketData, 3);
      console.log('Recent data (last 3 months):', recentData.length, 'records');
      
      const processedCommodities = this.processMarketData(recentData.length > 0 ? recentData : marketData);
      
      // Generate insights using LLM
      const { llmService } = await import('./llmService');
      const aiInsights = await llmService.generateMarketInsights(processedCommodities, location);

      // Determine data source for display
      let dataSource = 'Real-time API data';
      if (marketData && marketData.length > 0) {
        const firstRecord = marketData[0];
        if (firstRecord.State && firstRecord.State !== state) {
          dataSource = `Data from ${firstRecord.State}`;
        } else if (firstRecord.District && firstRecord.District !== district) {
          dataSource = `Data from ${firstRecord.State} (state-wide)`;
        } else if (firstRecord.State) {
          dataSource = `Data from ${firstRecord.State}`;
        }
      } else {
        dataSource = 'Sample data (API unavailable)';
      }

      return {
        location: {
          state,
          district,
          displayName: geocodingService.formatLocationForDisplay(location)
        },
        commodities: processedCommodities,
        marketNews: aiInsights.marketNews,
        marketFactors: aiInsights.marketFactors,
        generalAdvice: aiInsights.generalAdvice,
        dataSource
      };
    } catch (error) {
      console.error('Error getting market insights:', error);
      // Return fallback data
      return this.getFallbackMarketInsights();
    }
  }

  private async testApiConnection(): Promise<void> {
    try {
      console.log('Testing API connection...');
      
      const url = `${this.BASE_URL}/${this.RESOURCE_ID}`;
      const params = new URLSearchParams({
        'api-key': this.API_KEY,
        'format': 'json',
        'limit': '1',
        'offset': '0'
      });

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('API Test Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Test Error:', errorText);
        throw new Error(`API connection failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Test Response:', JSON.stringify(data, null, 2));
      
      // Check if the response indicates an error
      if (data.status === 'error') {
        console.error('API Test returned error status:', data);
        throw new Error(`API Test Error: ${data.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('API connection test failed:', error);
      throw error;
    }
  }

  private async getMarketData(state: string, district: string): Promise<MarketPriceRecord[]> {
    try {
      console.log('Fetching market data for:', { state, district });
      
      const url = `${this.BASE_URL}/${this.RESOURCE_ID}`;
      const params = new URLSearchParams({
        'api-key': this.API_KEY,
        'format': 'json',
        'limit': '2000', // Increased limit to get more data
        'offset': '0',
        'filters[State]': state
      });

      // Only add district filter if district is provided and not empty
      if (district && district.trim() !== '') {
        params.append('filters[District]', district);
      }

      console.log('API URL:', `${url}?${params}`);
      
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('API Response status:', response.status);
      console.log('API Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(`Market API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Full API response:', JSON.stringify(data, null, 2));
      console.log('Market data received:', data.count, 'records');
      console.log('Records array:', data.records);
      
      // Check if the response indicates an error
      if (data.status === 'error') {
        console.error('API returned error status:', data);
        throw new Error(`API Error: ${data.message || 'Unknown error'}`);
      }

      // Handle different response structures
      let apiRecords: ApiMarketRecord[] = [];
      if (data.records && Array.isArray(data.records)) {
        apiRecords = data.records;
      } else if (data.data && Array.isArray(data.data)) {
        apiRecords = data.data;
      } else if (Array.isArray(data)) {
        apiRecords = data;
      } else {
        console.warn('Unexpected API response structure:', data);
        return [];
      }

      // Convert API records to our expected format
      const records = this.convertApiRecordsToMarketRecords(apiRecords);
      console.log('Converted records:', records.length, 'records');

      // Sort records by date locally (most recent first)
      return this.sortRecordsByDate(records);
    } catch (error) {
      console.error('Error fetching market data:', error);
      return [];
    }
  }

  private async getMarketDataWithoutFilters(): Promise<MarketPriceRecord[]> {
    try {
      console.log('Fetching market data without filters...');
      
      const url = `${this.BASE_URL}/${this.RESOURCE_ID}`;
      const params = new URLSearchParams({
        'api-key': this.API_KEY,
        'format': 'json',
        'limit': '1000',
        'offset': '0'
      });

      console.log('API URL (no filters):', `${url}?${params}`);
      
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Market API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Market data (no filters) received:', data.count, 'records');

      // Handle different response structures
      let apiRecords: ApiMarketRecord[] = [];
      if (data.records && Array.isArray(data.records)) {
        apiRecords = data.records;
      } else if (data.data && Array.isArray(data.data)) {
        apiRecords = data.data;
      } else if (Array.isArray(data)) {
        apiRecords = data;
      } else {
        console.warn('Unexpected API response structure (no filters):', data);
        return [];
      }

      // Convert API records to our expected format
      const records = this.convertApiRecordsToMarketRecords(apiRecords);
      console.log('Converted records (no filters):', records.length, 'records');

      // Sort records by date locally (most recent first)
      return this.sortRecordsByDate(records);
    } catch (error) {
      console.error('Error fetching market data without filters:', error);
      return [];
    }
  }

  private async getRecentMarketData(): Promise<MarketPriceRecord[]> {
    try {
      console.log('Fetching recent market data from any state...');
      
      const url = `${this.BASE_URL}/${this.RESOURCE_ID}`;
      const params = new URLSearchParams({
        'api-key': this.API_KEY,
        'format': 'json',
        'limit': '500',
        'offset': '0'
      });

      console.log('API URL (recent data):', `${url}?${params}`);
      
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Market API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Recent market data received:', data.count, 'records');

      // Handle different response structures
      let apiRecords: ApiMarketRecord[] = [];
      if (data.records && Array.isArray(data.records)) {
        apiRecords = data.records;
      } else if (data.data && Array.isArray(data.data)) {
        apiRecords = data.data;
      } else if (Array.isArray(data)) {
        apiRecords = data;
      } else {
        console.warn('Unexpected API response structure (recent data):', data);
        return [];
      }

      // Convert API records to our expected format
      const records = this.convertApiRecordsToMarketRecords(apiRecords);
      console.log('Converted records (recent data):', records.length, 'records');

      // Sort records by date locally (most recent first)
      return this.sortRecordsByDate(records);
    } catch (error) {
      console.error('Error fetching recent market data:', error);
      return [];
    }
  }

  private async getMarketDataWithAlternativeParams(state: string, district: string): Promise<MarketPriceRecord[]> {
    try {
      console.log('Fetching market data with alternative parameters...');
      
      const url = `${this.BASE_URL}/${this.RESOURCE_ID}`;
      const params = new URLSearchParams({
        'api-key': this.API_KEY,
        'format': 'json',
        'limit': '100',
        'offset': '0'
      });

      // Try with just state filter, no district
      if (state) {
        params.append('filters[State]', state);
      }

      console.log('API URL (alternative params):', `${url}?${params}`);
      
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Market API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Alternative API response:', JSON.stringify(data, null, 2));

      // Check if the response indicates an error
      if (data.status === 'error') {
        console.error('Alternative API returned error status:', data);
        return [];
      }

      // Handle different response structures
      let apiRecords: ApiMarketRecord[] = [];
      if (data.records && Array.isArray(data.records)) {
        apiRecords = data.records;
      } else if (data.data && Array.isArray(data.data)) {
        apiRecords = data.data;
      } else if (Array.isArray(data)) {
        apiRecords = data;
      } else {
        console.warn('Unexpected API response structure (alternative):', data);
        return [];
      }

      // Convert API records to our expected format
      const records = this.convertApiRecordsToMarketRecords(apiRecords);
      console.log('Converted records (alternative):', records.length, 'records');

      // Sort records by date locally (most recent first)
      return this.sortRecordsByDate(records);
    } catch (error) {
      console.error('Error fetching market data with alternative params:', error);
      return [];
    }
  }

  private async getMarketDataFromAlternativeEndpoint(state: string, district: string): Promise<MarketPriceRecord[]> {
    try {
      console.log('Fetching market data from alternative endpoint...');
      
      // Try a different API endpoint or resource ID
      const alternativeResourceId = '9ef84268-d588-465a-a308-a864a43d0070';
      const url = `${this.BASE_URL}/${alternativeResourceId}`;
      const params = new URLSearchParams({
        'api-key': this.API_KEY,
        'format': 'json',
        'limit': '50',
        'offset': '0'
      });

      console.log('Alternative endpoint URL:', `${url}?${params}`);
      
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Alternative API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Alternative endpoint response:', JSON.stringify(data, null, 2));

      // Check if the response indicates an error
      if (data.status === 'error') {
        console.error('Alternative endpoint returned error status:', data);
        return [];
      }

      // Handle different response structures
      let apiRecords: ApiMarketRecord[] = [];
      if (data.records && Array.isArray(data.records)) {
        apiRecords = data.records;
      } else if (data.data && Array.isArray(data.data)) {
        apiRecords = data.data;
      } else if (Array.isArray(data)) {
        apiRecords = data;
      } else {
        console.warn('Unexpected API response structure (alternative endpoint):', data);
        return [];
      }

      // Convert API records to our expected format
      const records = this.convertApiRecordsToMarketRecords(apiRecords);
      console.log('Converted records (alternative endpoint):', records.length, 'records');

      // Sort records by date locally (most recent first)
      return this.sortRecordsByDate(records);
    } catch (error) {
      console.error('Error fetching market data from alternative endpoint:', error);
      return [];
    }
  }

  private async getMarketDataWithPagination(state: string, district: string): Promise<MarketPriceRecord[]> {
    try {
      console.log('Fetching market data with pagination...');
      
      const url = `${this.BASE_URL}/${this.RESOURCE_ID}`;
      let allRecords: ApiMarketRecord[] = [];
      let offset = 0;
      const limit = 1000;
      const maxPages = 5; // Limit to 5 pages to avoid too many requests
      
      for (let page = 0; page < maxPages; page++) {
        const params = new URLSearchParams({
          'api-key': this.API_KEY,
          'format': 'json',
          'limit': limit.toString(),
          'offset': offset.toString()
        });

        // Add filters if provided
        if (state) {
          params.append('filters[State]', state);
        }
        if (district && district.trim() !== '') {
          params.append('filters[District]', district);
        }

        console.log(`Fetching page ${page + 1}, offset ${offset}...`);
        
        const response = await fetch(`${url}?${params}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          console.error(`API error on page ${page + 1}:`, response.status);
          break;
        }

        const data = await response.json();
        
        if (data.status === 'error') {
          console.error(`API returned error on page ${page + 1}:`, data);
          break;
        }

        if (!data.records || data.records.length === 0) {
          console.log('No more records found');
          break;
        }

        allRecords = allRecords.concat(data.records);
        console.log(`Page ${page + 1}: Got ${data.records.length} records, total: ${allRecords.length}`);

        // If we got fewer records than requested, we've reached the end
        if (data.records.length < limit) {
          console.log('Reached end of available data');
          break;
        }

        offset += limit;
        
        // Add a small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`Pagination complete: ${allRecords.length} total records`);
      
      // Convert API records to our expected format
      const records = this.convertApiRecordsToMarketRecords(allRecords);
      console.log('Converted records (pagination):', records.length, 'records');

      // Sort records by date locally (most recent first)
      return this.sortRecordsByDate(records);
    } catch (error) {
      console.error('Error fetching market data with pagination:', error);
      return [];
    }
  }

  private async getMarketDataWithDifferentResource(state: string, district: string): Promise<MarketPriceRecord[]> {
    try {
      console.log('Fetching market data with different resource ID...');
      
      // Try the alternative resource ID from your Python code
      const alternativeResourceId = '35985678-0d79-46b4-9ed6-6f13308a1d24';
      const url = `${this.BASE_URL}/${alternativeResourceId}`;
      const params = new URLSearchParams({
        'api-key': this.API_KEY,
        'format': 'json',
        'limit': '1000',
        'offset': '0'
      });

      // Add filters if provided
      if (state) {
        params.append('filters[State]', state);
      }
      if (district && district.trim() !== '') {
        params.append('filters[District]', district);
      }

      console.log('Alternative resource URL:', `${url}?${params}`);
      
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Alternative resource API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Alternative resource response:', JSON.stringify(data, null, 2));

      // Check if the response indicates an error
      if (data.status === 'error') {
        console.error('Alternative resource returned error status:', data);
        return [];
      }

      // Handle different response structures
      let apiRecords: ApiMarketRecord[] = [];
      if (data.records && Array.isArray(data.records)) {
        apiRecords = data.records;
      } else if (data.data && Array.isArray(data.data)) {
        apiRecords = data.data;
      } else if (Array.isArray(data)) {
        apiRecords = data;
      } else {
        console.warn('Unexpected API response structure (alternative resource):', data);
        return [];
      }

      // Convert API records to our expected format
      const records = this.convertApiRecordsToMarketRecords(apiRecords);
      console.log('Converted records (alternative resource):', records.length, 'records');

      // Sort records by date locally (most recent first)
      return this.sortRecordsByDate(records);
    } catch (error) {
      console.error('Error fetching market data with different resource:', error);
      return [];
    }
  }

  private convertApiRecordsToMarketRecords(apiRecords: ApiMarketRecord[]): MarketPriceRecord[] {
    return apiRecords.map(record => ({
      State: record.state || '',
      District: record.district || '',
      Market: record.market || '',
      Commodity: record.commodity || '',
      Variety: record.variety || '',
      Grade: record.grade || '',
      Arrival_Date: record.arrival_date || '',
      Min_Price: record.min_price?.toString() || '0',
      Max_Price: record.max_price?.toString() || '0',
      Modal_Price: record.modal_price?.toString() || '0',
      Commodity_Code: record.commodity_code?.toString() || '0'
    }));
  }

  private sortRecordsByDate(records: MarketPriceRecord[]): MarketPriceRecord[] {
    return records.sort((a, b) => {
      // Parse dates and sort in descending order (most recent first)
      const dateA = this.parseDate(a.Arrival_Date);
      const dateB = this.parseDate(b.Arrival_Date);
      
      if (dateA && dateB) {
        return dateB.getTime() - dateA.getTime();
      }
      
      // If dates can't be parsed, keep original order
      return 0;
    });
  }

  private filterRecentRecords(records: MarketPriceRecord[], monthsBack: number = 3): MarketPriceRecord[] {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);
    
    return records.filter(record => {
      const recordDate = this.parseDate(record.Arrival_Date);
      return recordDate && recordDate >= cutoffDate;
    });
  }

  private parseDate(dateString: string): Date | null {
    if (!dateString) return null;
    
    try {
      // Handle DD/MM/YYYY format
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        let year = parseInt(parts[2]);
        
        if (year < 2000) {
          // Assume 20xx if year is 2 digits
          year = 2000 + year;
        }
        
        return new Date(year, month, day);
      }
      
      // Handle YYYY-MM-DD format
      if (dateString.includes('-')) {
        return new Date(dateString);
      }
      
      // Try parsing as ISO date
      return new Date(dateString);
    } catch (error) {
      console.warn('Failed to parse date:', dateString, error);
      return null;
    }
  }

  private processMarketData(records: MarketPriceRecord[]): ProcessedMarketData[] {
    console.log('Processing market data:', records.length, 'records');
    
    if (!records || records.length === 0) {
      console.log('No records found, using mock data');
      return this.getMockMarketData();
    }

    // Filter out invalid records and clean data
    const validRecords = records.filter(record => {
      if (!record || !record.Commodity) return false;
      
      // Clean and validate price data
      const modalPrice = record.Modal_Price?.toString().replace(/[^\d.-]/g, '');
      const minPrice = record.Min_Price?.toString().replace(/[^\d.-]/g, '');
      const maxPrice = record.Max_Price?.toString().replace(/[^\d.-]/g, '');
      
      if (!modalPrice || isNaN(parseFloat(modalPrice))) return false;
      
      // Update the record with cleaned data
      record.Modal_Price = modalPrice;
      if (minPrice && !isNaN(parseFloat(minPrice))) {
        record.Min_Price = minPrice;
      }
      if (maxPrice && !isNaN(parseFloat(maxPrice))) {
        record.Max_Price = maxPrice;
      }
      
      return true;
    });

    console.log('Valid records after filtering and cleaning:', validRecords.length);

    if (validRecords.length === 0) {
      console.log('No valid records found, using mock data');
      return this.getMockMarketData();
    }

    // Group by commodity and variety
    const groupedData = new Map<string, MarketPriceRecord[]>();
    
    validRecords.forEach(record => {
      const key = `${record.Commodity}-${record.Variety}-${record.Grade}`;
      if (!groupedData.has(key)) {
        groupedData.set(key, []);
      }
      groupedData.get(key)?.push(record);
    });

    const processedCommodities: ProcessedMarketData[] = [];

    groupedData.forEach((records, key) => {
      if (records.length === 0) return;

      // Sort by date (newest first)
      const sortedRecords = records.sort((a, b) => {
        const dateA = new Date(a.Arrival_Date.split('/').reverse().join('-'));
        const dateB = new Date(b.Arrival_Date.split('/').reverse().join('-'));
        return dateB.getTime() - dateA.getTime();
      });

      const latestRecord = sortedRecords[0];
      const prices = sortedRecords.map(r => parseInt(r.Modal_Price) || 0).filter(p => p > 0);
      
      if (prices.length === 0) return;

      const currentPrice = prices[0];
      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Calculate price change (compare with 30 days ago if available)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const oldRecords = sortedRecords.filter(r => {
        const recordDate = new Date(r.Arrival_Date.split('/').reverse().join('-'));
        return recordDate <= thirtyDaysAgo;
      });

      let priceChange = 0;
      let priceChangePercent = 0;
      
      if (oldRecords.length > 0) {
        const oldPrice = parseInt(oldRecords[0].Modal_Price) || currentPrice;
        priceChange = currentPrice - oldPrice;
        priceChangePercent = (priceChange / oldPrice) * 100;
      }

      // Determine trend
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (priceChangePercent > 5) trend = 'up';
      else if (priceChangePercent < -5) trend = 'down';

      // Generate price history (last 6 months)
      const priceHistory = this.generatePriceHistory(sortedRecords);

      // Determine demand and supply based on price trends and volatility
      const priceVolatility = this.calculatePriceVolatility(prices);
      const demand = this.determineDemand(priceChangePercent, priceVolatility);
      const supply = this.determineSupply(priceChangePercent, priceVolatility);

      // Generate forecast
      const forecast = this.generateForecast(trend, priceChangePercent, demand, supply);

      processedCommodities.push({
        commodity: latestRecord.Commodity,
        variety: latestRecord.Variety,
        grade: latestRecord.Grade,
        currentPrice,
        minPrice,
        maxPrice,
        averagePrice: Math.round(averagePrice),
        priceChange: Math.round(priceChange),
        priceChangePercent: Math.round(priceChangePercent * 100) / 100,
        trend,
        demand,
        supply,
        forecast,
        lastUpdated: latestRecord.Arrival_Date,
        marketCount: new Set(records.map(r => r.Market)).size,
        priceHistory
      });
    });

    // Sort by current price (highest first)
    return processedCommodities.sort((a, b) => b.currentPrice - a.currentPrice);
  }

  private generatePriceHistory(records: MarketPriceRecord[]): PriceHistoryPoint[] {
    const history: PriceHistoryPoint[] = [];
    const monthlyData = new Map<string, number[]>();

    // Group by month
    records.forEach(record => {
      const date = new Date(record.Arrival_Date.split('/').reverse().join('-'));
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, []);
      }
      monthlyData.get(monthKey)?.push(parseInt(record.Modal_Price) || 0);
    });

    // Calculate average price for each month
    monthlyData.forEach((prices, monthKey) => {
      const validPrices = prices.filter(p => p > 0);
      if (validPrices.length > 0) {
        const avgPrice = validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;
        const [year, month] = monthKey.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        history.push({
          date: monthKey,
          price: Math.round(avgPrice),
          month: monthNames[parseInt(month) - 1]
        });
      }
    });

    // Sort by date and return last 6 months
    return history.sort((a, b) => a.date.localeCompare(b.date)).slice(-6);
  }

  private calculatePriceVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    return Math.sqrt(variance) / mean * 100; // Coefficient of variation
  }

  private determineDemand(priceChangePercent: number, volatility: number): 'Low' | 'Medium' | 'High' | 'Very High' {
    if (priceChangePercent > 15 && volatility < 20) return 'Very High';
    if (priceChangePercent > 5 || volatility > 30) return 'High';
    if (priceChangePercent > -5) return 'Medium';
    return 'Low';
  }

  private determineSupply(priceChangePercent: number, volatility: number): 'Low' | 'Medium' | 'High' | 'Very High' {
    if (priceChangePercent < -15 && volatility < 20) return 'Very High';
    if (priceChangePercent < -5 || volatility > 30) return 'High';
    if (priceChangePercent < 5) return 'Medium';
    return 'Low';
  }

  private generateForecast(trend: 'up' | 'down' | 'stable', priceChangePercent: number, demand: string, supply: string): string {
    if (trend === 'up' && demand === 'Very High') {
      return 'Strong upward trend expected due to high demand';
    }
    if (trend === 'down' && supply === 'Very High') {
      return 'Prices may continue declining due to oversupply';
    }
    if (trend === 'up') {
      return 'Prices expected to rise 5-10% in next month';
    }
    if (trend === 'down') {
      return 'Prices may stabilize or decline slightly';
    }
    return 'Prices expected to remain stable with minor fluctuations';
  }

  private getMockMarketData(): ProcessedMarketData[] {
    return [
      {
        commodity: 'Rice',
        variety: 'Basmati',
        grade: 'FAQ',
        currentPrice: 2850,
        minPrice: 2650,
        maxPrice: 3050,
        averagePrice: 2750,
        priceChange: 150,
        priceChangePercent: 5.56,
        trend: 'up',
        demand: 'High',
        supply: 'Medium',
        forecast: 'Prices expected to rise 8-12% in next month',
        lastUpdated: '15/12/2024',
        marketCount: 5,
        priceHistory: [
          { date: '2024-07', price: 2650, month: 'Jul' },
          { date: '2024-08', price: 2720, month: 'Aug' },
          { date: '2024-09', price: 2780, month: 'Sep' },
          { date: '2024-10', price: 2750, month: 'Oct' },
          { date: '2024-11', price: 2820, month: 'Nov' },
          { date: '2024-12', price: 2850, month: 'Dec' }
        ]
      },
      {
        commodity: 'Wheat',
        variety: 'Lokwan',
        grade: 'FAQ',
        currentPrice: 2200,
        minPrice: 2100,
        maxPrice: 2300,
        averagePrice: 2180,
        priceChange: -50,
        priceChangePercent: -2.22,
        trend: 'down',
        demand: 'Medium',
        supply: 'High',
        forecast: 'Prices may stabilize with good harvest',
        lastUpdated: '15/12/2024',
        marketCount: 3,
        priceHistory: [
          { date: '2024-07', price: 2250, month: 'Jul' },
          { date: '2024-08', price: 2230, month: 'Aug' },
          { date: '2024-09', price: 2210, month: 'Sep' },
          { date: '2024-10', price: 2200, month: 'Oct' },
          { date: '2024-11', price: 2190, month: 'Nov' },
          { date: '2024-12', price: 2200, month: 'Dec' }
        ]
      },
      {
        commodity: 'Sugarcane',
        variety: 'Co-86032',
        grade: 'FAQ',
        currentPrice: 3200,
        minPrice: 3000,
        maxPrice: 3400,
        averagePrice: 3150,
        priceChange: 200,
        priceChangePercent: 6.67,
        trend: 'up',
        demand: 'Very High',
        supply: 'Low',
        forecast: 'Strong upward trend expected due to ethanol demand',
        lastUpdated: '15/12/2024',
        marketCount: 4,
        priceHistory: [
          { date: '2024-07', price: 3000, month: 'Jul' },
          { date: '2024-08', price: 3050, month: 'Aug' },
          { date: '2024-09', price: 3100, month: 'Sep' },
          { date: '2024-10', price: 3150, month: 'Oct' },
          { date: '2024-11', price: 3180, month: 'Nov' },
          { date: '2024-12', price: 3200, month: 'Dec' }
        ]
      },
      {
        commodity: 'Cotton',
        variety: 'Bharat',
        grade: 'FAQ',
        currentPrice: 6500,
        minPrice: 6200,
        maxPrice: 6800,
        averagePrice: 6400,
        priceChange: 100,
        priceChangePercent: 1.56,
        trend: 'up',
        demand: 'High',
        supply: 'Medium',
        forecast: 'Prices expected to remain stable with slight upward trend',
        lastUpdated: '15/12/2024',
        marketCount: 6,
        priceHistory: [
          { date: '2024-07', price: 6400, month: 'Jul' },
          { date: '2024-08', price: 6350, month: 'Aug' },
          { date: '2024-09', price: 6300, month: 'Sep' },
          { date: '2024-10', price: 6450, month: 'Oct' },
          { date: '2024-11', price: 6480, month: 'Nov' },
          { date: '2024-12', price: 6500, month: 'Dec' }
        ]
      },
      {
        commodity: 'Tomato',
        variety: 'Hybrid',
        grade: 'FAQ',
        currentPrice: 4500,
        minPrice: 4000,
        maxPrice: 5000,
        averagePrice: 4250,
        priceChange: -250,
        priceChangePercent: -5.26,
        trend: 'down',
        demand: 'Medium',
        supply: 'High',
        forecast: 'Prices may stabilize as supply increases',
        lastUpdated: '15/12/2024',
        marketCount: 8,
        priceHistory: [
          { date: '2024-07', price: 4200, month: 'Jul' },
          { date: '2024-08', price: 4800, month: 'Aug' },
          { date: '2024-09', price: 4600, month: 'Sep' },
          { date: '2024-10', price: 4400, month: 'Oct' },
          { date: '2024-11', price: 4700, month: 'Nov' },
          { date: '2024-12', price: 4500, month: 'Dec' }
        ]
      },
      {
        commodity: 'Potato',
        variety: 'Kufri',
        grade: 'FAQ',
        currentPrice: 1800,
        minPrice: 1600,
        maxPrice: 2000,
        averagePrice: 1750,
        priceChange: 50,
        priceChangePercent: 2.86,
        trend: 'up',
        demand: 'High',
        supply: 'Medium',
        forecast: 'Prices expected to rise due to festival demand',
        lastUpdated: '15/12/2024',
        marketCount: 7,
        priceHistory: [
          { date: '2024-07', price: 1700, month: 'Jul' },
          { date: '2024-08', price: 1650, month: 'Aug' },
          { date: '2024-09', price: 1720, month: 'Sep' },
          { date: '2024-10', price: 1750, month: 'Oct' },
          { date: '2024-11', price: 1780, month: 'Nov' },
          { date: '2024-12', price: 1800, month: 'Dec' }
        ]
      }
    ];
  }

  private getFallbackMarketInsights(): MarketInsights {
    return {
      location: {
        state: 'Unknown State',
        district: 'Unknown District',
        displayName: 'Location not available'
      },
      commodities: this.getMockMarketData(),
      marketNews: [
        {
          title: 'Market Data Unavailable',
          summary: 'Unable to fetch real-time market data. Using sample data.',
          impact: 'Neutral',
          time: 'Just now',
          source: 'System'
        }
      ],
      marketFactors: [
        {
          factor: 'Data Connection',
          impact: 'Neutral',
          description: 'Real-time market data is currently unavailable',
          icon: 'warning'
        }
      ],
      generalAdvice: 'Please check your internet connection and try again for real-time market insights.',
      dataSource: 'Sample data (API unavailable)'
    };
  }
}

export const marketService = MarketService.getInstance();
