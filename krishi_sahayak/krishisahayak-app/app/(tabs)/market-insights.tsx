import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import Text from '../components/Text';
import { MarketInsights, marketService } from '../utils/marketService';

export default function MarketInsightsScreen() {
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [marketInsights, setMarketInsights] = useState<MarketInsights | null>(null);
  const [filteredCommodities, setFilteredCommodities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      console.log('Fetching market data...');
      
      const insights = await marketService.getMarketInsights();
      console.log('Market insights received:', insights);
      
      setMarketInsights(insights);
      setFilteredCommodities(insights.commodities);
    } catch (error) {
      console.error('Error fetching market data:', error);
      Alert.alert('Error', 'Failed to fetch market data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCropSelection = (cropName: string) => {
    if (selectedCrop === cropName) {
      // If same crop is selected, show all commodities
      setSelectedCrop(null);
      setFilteredCommodities(marketInsights?.commodities || []);
    } else {
      // Filter commodities by selected crop
      setSelectedCrop(cropName);
      const filtered = marketInsights?.commodities.filter(commodity => 
        commodity.commodity.toLowerCase().includes(cropName.toLowerCase())
      ) || [];
      setFilteredCommodities(filtered);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMarketData();
    setRefreshing(false);
  }, []);

  const crops = [
    { id: 'all', name: 'All Crops', icon: '🌾' },
    { id: 'rice', name: 'Rice', icon: '🌾' },
    { id: 'wheat', name: 'Wheat', icon: '🌾' },
    { id: 'sugarcane', name: 'Sugarcane', icon: '🌾' },
    { id: 'cotton', name: 'Cotton', icon: '🌾' },
    { id: 'tomato', name: 'Tomato', icon: '🍅' },
    { id: 'potato', name: 'Potato', icon: '🥔' },
    { id: 'maize', name: 'Maize', icon: '🌽' },
    { id: 'onion', name: 'Onion', icon: '🧅' }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return '#10b981';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Positive': return '#10b981';
      case 'Negative': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getImpactBgColor = (impact: string) => {
    switch (impact) {
      case 'Positive': return 'bg-green-100';
      case 'Negative': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  const getImpactTextColor = (impact: string) => {
    switch (impact) {
      case 'Positive': return 'text-green-800';
      case 'Negative': return 'text-red-800';
      default: return 'text-gray-800';
    }
  };

  const getCommodityIcon = (commodity: string) => {
    switch (commodity.toLowerCase()) {
      case 'rice': return '🌾';
      case 'wheat': return '🌾';
      case 'sugarcane': return '🌾';
      case 'cotton': return '🌾';
      case 'tomato': return '🍅';
      case 'potato': return '🥔';
      case 'maize': return '🌽';
      case 'onion': return '🧅';
      default: return '🌾';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Ionicons name="refresh" size={32} color="#6b7280" className="animate-spin" />
        <Text className="text-gray-600 mt-4">Loading market data...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
        }
      >
        {/* Header */}
        <View className="px-6 py-6">

          {/* Header */}
          <View className="mb-6">
            <View className="gradient-purple rounded-2xl p-6 mb-6">
              <View className="flex-row items-center mb-4">
                <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center mr-4">
                  <Ionicons name="trending-up" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-lg font-semibold">Market Intelligence</Text>
                  <Text className="text-purple-100 text-sm">
                    {marketInsights?.location.displayName || 'Loading location...'}
                  </Text>
                  {marketInsights?.dataSource && (
                    <Text className="text-purple-200 text-xs mt-1">
                      {marketInsights.dataSource}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Crop Selection */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Filter by Crop</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {crops.map((crop) => (
                <TouchableOpacity
                  key={crop.id}
                  onPress={() => handleCropSelection(crop.id)}
                  className={`mr-3 px-4 py-3 rounded-xl border ${
                    selectedCrop === crop.id
                      ? 'bg-purple-600 border-purple-600'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <Text className="text-2xl mb-1">{crop.icon}</Text>
                  <Text className={`font-semibold text-sm ${
                    selectedCrop === crop.id ? 'text-white' : 'text-gray-700'
                  }`}>
                    {crop.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {selectedCrop && selectedCrop !== 'all' && (
              <View className="mt-3">
                <Text className="text-sm text-gray-600">
                  Showing {filteredCommodities.length} {selectedCrop} commodity(ies)
                </Text>
              </View>
            )}
          </View>

          {/* Market Overview */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">Market Overview</Text>
            {filteredCommodities && filteredCommodities.length > 0 ? (
              filteredCommodities.map((data, index) => (
                <View key={index} className="card mb-4">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-3">{getCommodityIcon(data.commodity)}</Text>
                      <View>
                        <Text className="text-lg font-bold text-gray-900">{data.commodity}</Text>
                        <Text className="text-gray-600 text-sm">{data.variety} - {data.grade}</Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-2xl font-bold text-gray-900">₹{data.currentPrice}</Text>
                      <Text className="text-xs text-gray-500">per quintal</Text>
                      <View className={`flex-row items-center ${
                        data.trend === 'up' ? 'text-green-600' : data.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        <Ionicons 
                          name={getTrendIcon(data.trend) as any} 
                          size={16} 
                          color={getTrendColor(data.trend)} 
                        />
                        <Text className="font-semibold ml-1">
                          {data.priceChangePercent > 0 ? '+' : ''}{data.priceChangePercent}%
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-gray-600 text-sm">Demand</Text>
                      <View className={`px-2 py-1 rounded-full ${
                        data.demand === 'High' ? 'bg-green-100' :
                        data.demand === 'Very High' ? 'bg-green-200' : 
                        data.demand === 'Medium' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        <Text className={`text-xs font-semibold ${
                          data.demand === 'High' || data.demand === 'Very High' ? 'text-green-800' : 
                          data.demand === 'Medium' ? 'text-yellow-800' : 'text-red-800'
                        }`}>
                          {data.demand}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-600 text-sm">Supply</Text>
                      <View className={`px-2 py-1 rounded-full ${
                        data.supply === 'High' ? 'bg-blue-100' : 
                        data.supply === 'Very High' ? 'bg-blue-200' :
                        data.supply === 'Medium' ? 'bg-orange-100' : 'bg-red-100'
                      }`}>
                        <Text className={`text-xs font-semibold ${
                          data.supply === 'High' || data.supply === 'Very High' ? 'text-blue-800' : 
                          data.supply === 'Medium' ? 'text-orange-800' : 'text-red-800'
                        }`}>
                          {data.supply}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-1 ml-2">
                      <Text className="text-gray-600 text-sm">Markets</Text>
                      <Text className="text-xs font-semibold text-gray-800">{data.marketCount}</Text>
                    </View>
                  </View>

                  <View className="border-t border-gray-100 pt-3">
                    <Text className="text-gray-600 text-sm mb-2">Forecast:</Text>
                    <Text className="font-semibold text-gray-900 text-sm">{data.forecast}</Text>
                    <Text className="text-gray-500 text-xs mt-1">Last updated: {data.lastUpdated}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View className="card items-center py-8">
                <Ionicons name="warning" size={32} color="#6b7280" />
                <Text className="text-gray-600 mt-2 text-center">No market data available</Text>
                <Text className="text-gray-500 text-sm text-center mt-1">Try refreshing or check your location</Text>
              </View>
            )}
          </View>

          {/* Price Trends */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">Price Trends (6 Months)</Text>
            <View className="card">
              {filteredCommodities && filteredCommodities.length > 0 ? (
                <View className="flex-row justify-between items-end h-32 mb-4">
                  {filteredCommodities[0].priceHistory.map((item: any, index: number) => (
                    <View key={index} className="flex-1 items-center">
                      <View 
                        className="bg-purple-500 rounded-t w-6 mb-2"
                        style={{ 
                          height: Math.max(20, (item.price - Math.min(...filteredCommodities[0].priceHistory.map((h: any) => h.price))) / 10)
                        }}
                      />
                      <Text className="text-xs text-gray-600">{item.month}</Text>
                      <Text className="text-xs font-semibold text-gray-900">₹{item.price}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="items-center py-8">
                  <Ionicons name="bar-chart" size={32} color="#6b7280" />
                  <Text className="text-gray-600 mt-2">No price history available</Text>
                </View>
              )}
            </View>
          </View>

          {/* Market News */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">Market News</Text>
            {marketInsights?.marketNews && marketInsights.marketNews.length > 0 ? (
              <View className="space-y-3">
                {marketInsights.marketNews.map((news, index) => (
                  <View key={index} className="card">
                    <View className="flex-row items-start justify-between mb-2">
                      <Text className="font-semibold text-gray-900 flex-1 mr-2">{news.title}</Text>
                      <View className={`px-2 py-1 rounded-full ${getImpactBgColor(news.impact)}`}>
                        <Text className={`text-xs font-semibold ${getImpactTextColor(news.impact)}`}>
                          {news.impact}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-gray-600 text-sm mb-2">{news.summary}</Text>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-500 text-xs">{news.time}</Text>
                      <Text className="text-gray-400 text-xs">{news.source}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="card items-center py-6">
                <Ionicons name="newspaper" size={32} color="#6b7280" />
                <Text className="text-gray-600 mt-2 text-center">No market news available</Text>
              </View>
            )}
          </View>

          {/* Market Factors */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">Key Market Factors</Text>
            {marketInsights?.marketFactors && marketInsights.marketFactors.length > 0 ? (
              <View className="card">
                <View className="space-y-3">
                  {marketInsights.marketFactors.map((factor, index) => (
                    <View key={index} className="flex-row items-start">
                      <Ionicons 
                        name={factor.icon as any} 
                        size={20} 
                        color={getImpactColor(factor.impact)} 
                      />
                      <View className="flex-1 ml-3">
                        <Text className="font-semibold text-gray-900 text-sm">{factor.factor}</Text>
                        <Text className="text-gray-600 text-sm mt-1">{factor.description}</Text>
                        <View className={`inline-block px-2 py-1 rounded-full mt-2 ${getImpactBgColor(factor.impact)}`}>
                          <Text className={`text-xs font-semibold ${getImpactTextColor(factor.impact)}`}>
                            {factor.impact} Impact
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View className="card items-center py-6">
                <Ionicons name="analytics" size={32} color="#6b7280" />
                <Text className="text-gray-600 mt-2 text-center">No market factors available</Text>
              </View>
            )}
          </View>

          {/* General Advice */}
          {marketInsights?.generalAdvice && (
            <View className="mb-8">
              <Text className="text-xl font-bold text-gray-900 mb-4">Market Advice</Text>
              <View className="card">
                <View className="flex-row items-start">
                  <Ionicons name="bulb" size={20} color="#f59e0b" />
                  <View className="flex-1 ml-3">
                    <Text className="font-semibold text-gray-900 mb-2">AI Recommendation</Text>
                    <Text className="text-gray-600 text-sm leading-5">{marketInsights.generalAdvice}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
        
        {/* Bottom padding for tab bar */}
        <View style={{ height: Platform.OS === 'ios' ? 88 : 64 }} />
      </ScrollView>
    </View>
  );
}