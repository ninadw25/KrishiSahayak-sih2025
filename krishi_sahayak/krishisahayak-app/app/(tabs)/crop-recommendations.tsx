import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { geocodingService, LocationData } from '../utils/geocodingService';
import Text from '../components/Text';
import { getLanguageTexts } from '../utils/languages';
import { CropRecommendation, CropRecommendationRequest, llmService } from '../utils/llmService';
import { permissionManager } from '../utils/permissions';

export default function CropRecommendations() {
  const [selectedSeason, setSelectedSeason] = useState('kharif');
  const [selectedSoil, setSelectedSoil] = useState('loamy');
  const [locationType, setLocationType] = useState<'current' | 'manual'>('current');
  const [manualLocation, setManualLocation] = useState('');
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [farmerPreferences, setFarmerPreferences] = useState({
    waterAvailability: 'Medium' as 'High' | 'Medium' | 'Low',
    budget: 'Medium' as 'Low' | 'Medium' | 'High',
    experience: 'Intermediate' as 'Beginner' | 'Intermediate' | 'Expert',
    farmSize: 'Small' as 'Small' | 'Medium' | 'Large'
  });
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);

  const t = getLanguageTexts(currentLanguage);

  // Update seasons and soil types when language changes
  const seasons = [
    { id: 'kharif', name: t.kharif, months: t.kharifMonths },
    { id: 'rabi', name: t.rabi, months: t.rabiMonths },
    { id: 'zaid', name: t.zaid, months: t.zaidMonths }
  ];

  const soilTypes = [
    { id: 'loamy', name: t.loamy, description: t.loamyDesc, color: '#8B4513' },
    { id: 'clay', name: t.clay, description: t.clayDesc, color: '#A0522D' },
    { id: 'sandy', name: t.sandy, description: t.sandyDesc, color: '#F4A460' },
    { id: 'silt', name: t.silt, description: t.siltDesc, color: '#D2B48C' },
    { id: 'black', name: t.blackSoil, description: t.blackSoilDesc, color: '#2F2F2F' },
    { id: 'red', name: t.redSoil, description: t.redSoilDesc, color: '#CD5C5C' },
    { id: 'alluvial', name: t.alluvial, description: t.alluvialDesc, color: '#DEB887' }
  ];

  // Initialize location permission check
  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const permission = await permissionManager.checkLocationPermission();
    setLocationPermission(permission.granted);
    
    if (permission.granted) {
      await getCurrentLocation();
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const locationResult = await geocodingService.getLocationFromCurrentPosition();
      
      if (locationResult.success && locationResult.data) {
        setCurrentLocation(locationResult.data);
        console.log('Current location:', locationResult.data);
      } else {
        console.log('Failed to get current location:', locationResult.error);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLocationFromManualInput = async (locationName: string) => {
    try {
      setIsLoading(true);
      const coordinates = await geocodingService.getCoordinatesFromLocation(locationName);
      
      if (coordinates) {
        const locationData = await geocodingService.getLocationFromCoordinatesNominatim(
          coordinates.latitude, 
          coordinates.longitude
        );
        
        if (locationData) {
          setCurrentLocation(locationData);
          console.log('Manual location:', locationData);
          return locationData;
        }
      }
      
      Alert.alert(t.locationNotFound, t.couldNotFindLocation);
      return null;
    } catch (error) {
      console.error('Error getting location from manual input:', error);
      Alert.alert(t.error, t.failedToGetLocation);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generateRecommendations = async () => {
    try {
      setIsAnalyzing(true);
      
      // Validate inputs
      if (!selectedSeason || !selectedSoil) {
        Alert.alert(t.missingInformation, t.pleaseSelectBoth);
        setIsAnalyzing(false);
        return;
      }
      
      let locationData = currentLocation;
      
      // If manual location is selected and we have input, get location data
      if (locationType === 'manual' && manualLocation.trim()) {
        locationData = await getLocationFromManualInput(manualLocation.trim());
        if (!locationData) {
          setIsAnalyzing(false);
          return;
        }
      }
      
      // If no location data available, show error
      if (!locationData) {
        Alert.alert(
          t.locationRequired, 
          t.pleaseSelectLocation
        );
        setIsAnalyzing(false);
        return;
      }

      // Prepare request for LLM service
      const request: CropRecommendationRequest = {
        season: selectedSeason,
        soilType: selectedSoil,
        location: {
          name: geocodingService.formatLocationForDisplay(locationData),
          state: locationData.principalSubdivision,
          district: locationData.locality,
          coordinates: (await getCurrentCoordinates()) || undefined
        },
        preferences: farmerPreferences
      };

      console.log('Generating recommendations with request:', request);
      
      // Generate recommendations using LLM service
      const cropRecommendations = await llmService.generateCropRecommendations(request);
      
      console.log('Generated recommendations:', cropRecommendations);
      setRecommendations(cropRecommendations);
      setLastAnalysisTime(new Date());
      
    } catch (error) {
      console.error('Error generating recommendations:', error);
      Alert.alert(t.error, t.failedToGenerateRecommendations);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCurrentCoordinates = async () => {
    try {
      const location = await permissionManager.getCurrentLocation();
      return location;
    } catch (error) {
      console.error('Error getting current coordinates:', error);
      return undefined;
    }
  };

  const handleGetRecommendations = () => {
    generateRecommendations();
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Language Toggle */}
        <View className="px-6 py-4 bg-white border-b border-gray-100">
          <View className="flex-row items-center justify-between">
            {/* <Text className="text-lg font-semibold text-gray-900">{t.title}</Text> */}
            <View className="flex-row bg-gray-100 rounded-lg p-1">
              {[
                { code: 'en', name: 'English', flag: '🇺🇸' },
                { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
                { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' }
              ].map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => setCurrentLanguage(lang.code)}
                  className={`px-3 py-2 rounded-md ${
                    currentLanguage === lang.code
                      ? 'bg-white shadow-sm'
                      : 'bg-transparent'
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    currentLanguage === lang.code ? 'text-gray-900' : 'text-gray-600'
                  }`}>
                    {lang.flag} {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* AI Analysis Card */}
        <View className="px-6 py-6">
          {/* Filters */}
          <View className="space-y-4 mb-6">
            {/* Season Selection */}
            <View>
              <Text className="text-lg font-semibold text-gray-900 mb-3">{t.growingSeason}</Text>
              <View className="flex-row flex-wrap">
                {seasons.map((season) => (
                  <TouchableOpacity
                    key={season.id}
                    onPress={() => setSelectedSeason(season.id)}
                    className={`mr-3 mb-3 px-4 py-3 rounded-xl border ${
                      selectedSeason === season.id
                        ? 'bg-green-600 border-green-600'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <Text className={`font-semibold ${
                      selectedSeason === season.id ? 'text-white' : 'text-gray-700'
                    }`}>
                      {season.name}
                    </Text>
                    <Text className={`text-xs ${
                      selectedSeason === season.id ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {season.months}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Soil Type Selection */}
            <View>
              <Text className="text-lg font-semibold text-gray-900 mb-3">{t.soilType}</Text>
              <View className="flex-row flex-wrap">
                {soilTypes.map((soil) => (
                  <TouchableOpacity
                    key={soil.id}
                    onPress={() => setSelectedSoil(soil.id)}
                    className={`mr-3 mb-3 px-4 py-3 rounded-xl border ${
                      selectedSoil === soil.id
                        ? 'bg-green-600 border-green-600'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <Text className={`font-semibold ${
                      selectedSoil === soil.id ? 'text-white' : 'text-gray-700'
                    }`}>
                      {soil.name}
                    </Text>
                    <Text className={`text-xs ${
                      selectedSoil === soil.id ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {soil.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location Selection */}
            <View>
              <Text className="text-lg font-semibold text-gray-900 mb-3">{t.location}</Text>
              
              {/* Location Type Selection */}
              <View className="flex-row mb-4">
                <TouchableOpacity
                  onPress={() => setLocationType('current')}
                  className={`flex-1 mr-2 px-4 py-3 rounded-xl border ${
                    locationType === 'current'
                      ? 'bg-green-600 border-green-600'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <Text className={`font-semibold text-center ${
                    locationType === 'current' ? 'text-white' : 'text-gray-700'
                  }`}>
                    {t.currentLocation}
                  </Text>
                </TouchableOpacity>
                  <TouchableOpacity
                  onPress={() => setLocationType('manual')}
                  className={`flex-1 ml-2 px-4 py-3 rounded-xl border ${
                    locationType === 'manual'
                        ? 'bg-green-600 border-green-600'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                  <Text className={`font-semibold text-center ${
                    locationType === 'manual' ? 'text-white' : 'text-gray-700'
                  }`}>
                    {t.enterLocation}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Current Location Display */}
              {locationType === 'current' && (
                <View className="bg-white rounded-xl p-4 border border-gray-200">
                  {isLoading ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color="#059669" />
                      <Text className="text-gray-600 ml-2">{t.gettingLocation}</Text>
                    </View>
                  ) : currentLocation ? (
                    <View>
                      <Text className="text-gray-900 font-semibold">
                        {geocodingService.formatLocationForDisplay(currentLocation)}
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        {currentLocation.countryName}
                      </Text>
                    </View>
                  ) : !locationPermission ? (
                    <View>
                      <Text className="text-gray-600">{t.locationPermissionRequired}</Text>
                      <TouchableOpacity
                        onPress={checkLocationPermission}
                        className="mt-2"
                      >
                        <Text className="text-green-600 font-semibold">{t.grantPermission}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View>
                      <Text className="text-gray-600">{t.locationNotAvailable}</Text>
                      <TouchableOpacity
                        onPress={getCurrentLocation}
                        className="mt-2"
                      >
                        <Text className="text-green-600 font-semibold">{t.retry}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* Manual Location Input */}
              {locationType === 'manual' && (
                <View className="bg-white rounded-xl p-4 border border-gray-200">
                  <TextInput
                    value={manualLocation}
                    onChangeText={setManualLocation}
                    placeholder={t.enterLocationPlaceholder}
                    placeholderTextColor="#9ca3af"
                    className="text-gray-900 text-base border-b border-gray-200 pb-2"
                  />
                  <Text className="text-gray-500 text-xs mt-2">
                    {t.enterLocationHint}
                  </Text>
                </View>
              )}
            </View>

            {/* Farmer Preferences */}
            <View>
              <Text className="text-lg font-semibold text-gray-900 mb-3">{t.farmingProfile}</Text>
              
              {/* Water Availability */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">{t.waterAvailability}</Text>
                <View className="flex-row flex-wrap">
                  {[
                    { key: 'High', label: t.high },
                    { key: 'Medium', label: t.medium },
                    { key: 'Low', label: t.low }
                  ].map((level) => (
                    <TouchableOpacity
                      key={level.key}
                      onPress={() => setFarmerPreferences(prev => ({ ...prev, waterAvailability: level.key as any }))}
                      className={`mr-2 mb-2 px-3 py-2 rounded-lg border ${
                        farmerPreferences.waterAvailability === level.key
                          ? 'bg-blue-100 border-blue-500'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <Text className={`text-sm font-medium ${
                        farmerPreferences.waterAvailability === level.key ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        {level.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Budget Level */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">{t.budgetLevel}</Text>
                <View className="flex-row flex-wrap">
                  {[
                    { key: 'Low', label: t.low },
                    { key: 'Medium', label: t.medium },
                    { key: 'High', label: t.high }
                  ].map((level) => (
                    <TouchableOpacity
                      key={level.key}
                      onPress={() => setFarmerPreferences(prev => ({ ...prev, budget: level.key as any }))}
                      className={`mr-2 mb-2 px-3 py-2 rounded-lg border ${
                        farmerPreferences.budget === level.key
                          ? 'bg-green-100 border-green-500'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <Text className={`text-sm font-medium ${
                        farmerPreferences.budget === level.key ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {level.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Experience Level */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">{t.experienceLevel}</Text>
                <View className="flex-row flex-wrap">
                  {[
                    { key: 'Beginner', label: t.beginner },
                    { key: 'Intermediate', label: t.intermediate },
                    { key: 'Expert', label: t.expert }
                  ].map((level) => (
                    <TouchableOpacity
                      key={level.key}
                      onPress={() => setFarmerPreferences(prev => ({ ...prev, experience: level.key as any }))}
                      className={`mr-2 mb-2 px-3 py-2 rounded-lg border ${
                        farmerPreferences.experience === level.key
                          ? 'bg-purple-100 border-purple-500'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <Text className={`text-sm font-medium ${
                        farmerPreferences.experience === level.key ? 'text-purple-700' : 'text-gray-600'
                      }`}>
                        {level.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Farm Size */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">{t.farmSize}</Text>
                <View className="flex-row flex-wrap">
                  {[
                    { key: 'Small', label: t.small },
                    { key: 'Medium', label: t.medium },
                    { key: 'Large', label: t.large }
                  ].map((size) => (
                    <TouchableOpacity
                      key={size.key}
                      onPress={() => setFarmerPreferences(prev => ({ ...prev, farmSize: size.key as any }))}
                      className={`mr-2 mb-2 px-3 py-2 rounded-lg border ${
                        farmerPreferences.farmSize === size.key
                          ? 'bg-orange-100 border-orange-500'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <Text className={`text-sm font-medium ${
                        farmerPreferences.farmSize === size.key ? 'text-orange-700' : 'text-gray-600'
                      }`}>
                        {size.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                </View>
              </View>
            </View>
          </View>

          {/* <View className="gradient-green rounded-2xl p-6 mb-6"> */}
          <TouchableOpacity
              className="gradient-green rounded-xl py-3 mb-6 px-3"
              onPress={handleGetRecommendations}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-semibold ml-2">{t.analyzing}</Text>
                </View>
              ) : (
                <Text className="text-white font-semibold text-center">{t.recommend}</Text>
              )}
            </TouchableOpacity>
        
          {/* </View> */}

          {/* Recommendations */}
          <View>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">
                {recommendations.length > 0 ? t.recommendedCrops : t.getYourCropRecommendations}
              </Text>
              {recommendations.length > 0 && (
                <TouchableOpacity
                  onPress={handleGetRecommendations}
                  disabled={isAnalyzing}
                  className="flex-row items-center bg-green-100 px-3 py-2 rounded-lg"
                >
                  <Ionicons name="refresh" size={16} color="#059669" />
                  <Text className="text-green-700 font-medium ml-1 text-sm">
                    {isAnalyzing ? t.updating : t.refresh}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {recommendations.length === 0 ? (
              <View className="bg-white rounded-xl p-6 border border-gray-200">
                <View className="items-center">
                  <Ionicons name="leaf" size={48} color="#9ca3af" />
                  <Text className="text-gray-600 text-center mt-4 mb-2">
                    {t.noRecommendationsYet}
                  </Text>
                  <Text className="text-gray-500 text-center text-sm mb-4">
                    {t.noRecommendationsDesc}
                  </Text>
                  <TouchableOpacity
                    onPress={handleGetRecommendations}
                    disabled={isAnalyzing}
                    className="bg-green-600 px-6 py-3 rounded-lg"
                  >
                    <Text className="text-white font-semibold">{t.getRecommendations}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
            <View className="space-y-4">
              {recommendations.map((crop) => (
                <View key={crop.id} className="card">
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                      <Text className="text-3xl mr-3">{crop.image}</Text>
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-gray-900">{crop.name}</Text>
                        <Text className="text-gray-600 text-sm">{crop.variety}</Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <View className="bg-green-100 px-3 py-1 rounded-full">
                        <Text className="text-green-800 font-semibold text-sm">
                          {crop.suitability}% {t.match}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-gray-600 text-sm">{t.expectedYield}</Text>
                      <Text className="font-semibold text-gray-900">{crop.yield}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-600 text-sm">{t.profitRange}</Text>
                      <Text className="font-semibold text-green-600">{crop.profit}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-600 text-sm">{t.duration}</Text>
                      <Text className="font-semibold text-gray-900">{crop.duration}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <Ionicons name="water" size={16} color="#6b7280" />
                      <Text className="text-gray-600 text-sm ml-1">{crop.water} {t.water}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="leaf" size={16} color="#6b7280" />
                      <Text className="text-gray-600 text-sm ml-1">{t.sustainability}: {crop.sustainability}/10</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <Ionicons name="trending-up" size={16} color="#6b7280" />
                      <Text className="text-gray-600 text-sm ml-1">{t.roi}: {crop.expectedROI}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="time" size={16} color="#6b7280" />
                      <Text className="text-gray-600 text-sm ml-1">{t.plant}: {crop.bestPlantingTime}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <Ionicons name="storefront" size={16} color="#6b7280" />
                      <Text className="text-gray-600 text-sm ml-1">{t.demand}: {crop.marketDemand}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="warning" size={16} color="#6b7280" />
                      <Text className="text-gray-600 text-sm ml-1">{t.risk}: {crop.riskLevel}</Text>
                    </View>
                  </View>

                  <View className="border-t border-gray-100 pt-3">
                    <Text className="text-gray-600 text-sm mb-2">{t.keyBenefits}:</Text>
                    <View className="flex-row flex-wrap">
                      {crop.benefits.map((benefit, index) => (
                        <View key={index} className="bg-green-50 px-2 py-1 rounded-full mr-2 mb-2">
                          <Text className="text-green-700 text-xs">{benefit}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View className="border-t border-gray-100 pt-3 mt-3">
                    <Text className="text-gray-600 text-sm mb-2">{t.requirements}:</Text>
                    <View className="flex-row flex-wrap">
                      {crop.requirements.map((requirement, index) => (
                        <View key={index} className="bg-blue-50 px-2 py-1 rounded-full mr-2 mb-2">
                          <Text className="text-blue-700 text-xs">{requirement}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity className="btn-primary mt-4">
                    <Text className="text-white font-semibold text-center">{t.viewDetails}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            )}
          </View>
        </View>
        
        {/* Bottom padding for tab bar */}
        <View style={{ height: Platform.OS === 'ios' ? 88 : 64 }} />
      </ScrollView>
    </View>
  );
}