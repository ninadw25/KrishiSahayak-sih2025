import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Vibration,
    View
} from 'react-native';
import Text from './components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DiseaseData, diseaseService } from './utils/diseaseService';

// Using DiseaseData from diseaseService instead of local interface

export default function DiseaseDetection() {
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [cropInput, setCropInput] = useState('');
  const [showDiseases, setShowDiseases] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState<DiseaseData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [diseases, setDiseases] = useState<DiseaseData[]>([]);
  const [availableCrops, setAvailableCrops] = useState<string[]>([]);
  const [isLoadingCrops, setIsLoadingCrops] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DiseaseData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Load available crops on component mount
  useEffect(() => {
    const loadCrops = async () => {
      try {
        setIsLoadingCrops(true);
        const crops = await diseaseService.getAvailableCrops();
        setAvailableCrops(crops);
      } catch (error) {
        console.error('Error loading crops:', error);
        Alert.alert('Error', 'Failed to load available crops');
      } finally {
        setIsLoadingCrops(false);
      }
    };

    loadCrops();
  }, []);

  // Animation effects
  useEffect(() => {
    if (isProcessing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isProcessing]);

  const handleCropSubmit = useCallback(async () => {
    if (cropInput.trim() === '') return;

    const cropName = cropInput.toLowerCase().trim();
    
    // Check if crop is available
    if (!availableCrops.some(crop => crop.toLowerCase() === cropName)) {
      Alert.alert(
        'Crop Not Found',
        `Sorry, we don't have disease information for this crop yet. Available crops: ${availableCrops.join(', ')}`,
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedCrop(cropName);
    setIsProcessing(true);
    
    try {
      // Load diseases for the selected crop
      const cropDiseases = await diseaseService.getDiseasesByCrop(cropName);
      setDiseases(cropDiseases);
      setShowDiseases(true);
      Vibration.vibrate(50);
    } catch (error) {
      console.error('Error loading diseases:', error);
      Alert.alert('Error', 'Failed to load disease information for this crop');
    } finally {
      setIsProcessing(false);
    }
  }, [cropInput, availableCrops]);

  const handleDiseaseSelect = useCallback((disease: DiseaseData) => {
    setSelectedDisease(disease);
    Vibration.vibrate(50);
  }, []);

  const handleBackToDiseases = useCallback(() => {
    setSelectedDisease(null);
  }, []);

  const handleNewCrop = useCallback(() => {
    setSelectedCrop('');
    setCropInput('');
    setShowDiseases(false);
    setSelectedDisease(null);
    setDiseases([]);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const handleSearch = useCallback(async () => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await diseaseService.searchDiseases(searchQuery);
      setSearchResults(results);
      setShowDiseases(true);
      setSelectedCrop('Search Results');
    } catch (error) {
      console.error('Error searching diseases:', error);
      Alert.alert('Error', 'Failed to search diseases');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'high': return 'High Risk';
      case 'medium': return 'Medium Risk';
      case 'low': return 'Low Risk';
      default: return 'Unknown';
    }
  };

  // No need for currentCrop since we're using diseases state directly

  if (selectedDisease) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <KeyboardAvoidingView 
          className="flex-1" 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View className="px-6 py-4 bg-white border-b border-gray-100">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={handleBackToDiseases}
                className="flex-row items-center"
              >
                <Ionicons name="arrow-back" size={24} color="#059669" />
                <Text className="text-green-600 font-semibold ml-2">Back to Diseases</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNewCrop}
                className="px-4 py-2 bg-gray-100 rounded-lg"
              >
                <Text className="text-gray-700 font-medium">New Crop</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Disease Solution */}
          <ScrollView className="flex-1 px-6 py-4">
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-2xl font-bold text-gray-900 flex-1 mr-4">{selectedDisease.name}</Text>
                <View className={`px-3 py-2 rounded-full ${getSeverityColor(selectedDisease.severity)}`}>
                  <Text className="text-xs font-semibold">{getSeverityText(selectedDisease.severity)}</Text>
                </View>
              </View>
              
              <View className="w-full h-56 rounded-xl mb-6 overflow-hidden shadow-sm">
                <Image 
                  source={selectedDisease.image} 
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              
              <Text className="text-gray-700 text-base leading-6">{selectedDisease.description}</Text>
            </View>

            {/* Symptoms */}
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
              <Text className="text-xl font-bold text-gray-900 mb-3">🔍 Symptoms</Text>
              {selectedDisease.symptoms.map((symptom, index) => (
                <View key={index} className="flex-row items-start mb-2">
                  <Text className="text-red-500 mr-2">•</Text>
                  <Text className="text-gray-700 flex-1">{symptom}</Text>
                </View>
              ))}
            </View>

            {/* Causes */}
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
              <Text className="text-xl font-bold text-gray-900 mb-3">⚠️ Causes</Text>
              {selectedDisease.causes.map((cause, index) => (
                <View key={index} className="flex-row items-start mb-2">
                  <Text className="text-orange-500 mr-2">•</Text>
                  <Text className="text-gray-700 flex-1">{cause}</Text>
                </View>
              ))}
            </View>

            {/* Solutions */}
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
              <Text className="text-xl font-bold text-gray-900 mb-3">💡 Solutions</Text>
              {selectedDisease.solutions.map((solution, index) => (
                <View key={index} className="flex-row items-start mb-2">
                  <Text className="text-green-500 mr-2">•</Text>
                  <Text className="text-gray-700 flex-1">{solution}</Text>
                </View>
              ))}
            </View>

            {/* Prevention */}
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <Text className="text-xl font-bold text-gray-900 mb-3">🛡️ Prevention</Text>
              {selectedDisease.prevention.map((prevention, index) => (
                <View key={index} className="flex-row items-start mb-2">
                  <Text className="text-blue-500 mr-2">•</Text>
                  <Text className="text-gray-700 flex-1">{prevention}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (showDiseases && (diseases.length > 0 || searchResults.length > 0)) {
    const displayDiseases = searchResults.length > 0 ? searchResults : diseases;
    const isSearchResults = searchResults.length > 0;
    
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <KeyboardAvoidingView 
          className="flex-1" 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View className="px-6 py-4 bg-white border-b border-gray-100">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-bold text-gray-900 capitalize">
                  {isSearchResults ? `Search Results for "${searchQuery}"` : `${selectedCrop} Diseases`}
                </Text>
                <Text className="text-gray-600 text-sm">
                  {isSearchResults ? 'Found diseases matching your search' : 'Select a disease to see solutions'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleNewCrop}
                className="px-4 py-2 bg-gray-100 rounded-lg"
              >
                <Text className="text-gray-700 font-medium">New Search</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Diseases List */}
          <ScrollView className="flex-1 px-6 py-4">
            {displayDiseases.map((disease) => (
              <TouchableOpacity
                key={disease.id}
                onPress={() => handleDiseaseSelect(disease)}
                className="bg-white rounded-2xl p-5 shadow-sm mb-4"
              >
                <View className="flex-row items-start">
                  <View className="w-20 h-20 rounded-xl mr-4 flex-shrink-0 overflow-hidden shadow-sm">
                    <Image 
                      source={disease.image} 
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900 mb-2">{disease.name}</Text>
                    <Text className="text-gray-600 text-sm mb-3 leading-5" numberOfLines={3}>
                      {disease.description}
                    </Text>
                    <View className="flex-row items-center justify-between">
                      <View className={`px-3 py-1 rounded-full ${getSeverityColor(disease.severity)}`}>
                        <Text className="text-xs font-semibold">{getSeverityText(disease.severity)}</Text>
                      </View>
                      {isSearchResults && (
                        <Text className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded">
                          {disease.crop}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" className="ml-2 flex-shrink-0" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Main Content */}
        <ScrollView className="flex-1 px-6 py-4">
          {/* Search Section */}
          <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Search Diseases</Text>
            <View className="flex-row items-end space-x-3 mb-4">
              <View className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200">
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by disease name or crop..."
                  placeholderTextColor="#9ca3af"
                  className="text-gray-900 text-base"
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
              </View>
              <TouchableOpacity
                onPress={handleSearch}
                disabled={searchQuery.trim() === '' || isSearching}
                className={`w-12 h-12 rounded-full items-center justify-center shadow-sm ${
                  searchQuery.trim() === '' || isSearching
                    ? 'bg-gray-200' 
                    : 'bg-blue-600 shadow-blue-200'
                }`}
              >
                <Ionicons 
                  name="search" 
                  size={20} 
                  color={searchQuery.trim() === '' || isSearching ? '#9ca3af' : 'white'} 
                />
              </TouchableOpacity>
            </View>
            {isSearching && (
              <View className="flex-row items-center justify-center py-2">
                <Animated.View 
                  className="w-4 h-4 bg-blue-100 rounded-full items-center justify-center mr-2"
                  style={{
                    transform: [{ scale: pulseAnim }],
                  }}
                >
                  <Ionicons name="search" size={8} color="#3b82f6" />
                </Animated.View>
                <Text className="text-gray-600 text-sm">Searching diseases...</Text>
              </View>
            )}
          </View>

          {/* Crop Input Section */}
          <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Or Browse by Crop</Text>
            <View className="flex-row items-end space-x-3">
              <View className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200">
                <TextInput
                  value={cropInput}
                  onChangeText={setCropInput}
                  placeholder="e.g., Rice, Wheat, Corn, Sugarcane..."
                  placeholderTextColor="#9ca3af"
                  className="text-gray-900 text-base"
                  onSubmitEditing={handleCropSubmit}
                  returnKeyType="search"
                />
              </View>
              <TouchableOpacity
                onPress={handleCropSubmit}
                disabled={cropInput.trim() === '' || isProcessing}
                className={`w-12 h-12 rounded-full items-center justify-center shadow-sm ${
                  cropInput.trim() === '' || isProcessing
                    ? 'bg-gray-200' 
                    : 'bg-green-600 shadow-green-200'
                }`}
              >
                <Ionicons 
                  name="leaf" 
                  size={20} 
                  color={cropInput.trim() === '' || isProcessing ? '#9ca3af' : 'white'} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Processing Indicator */}
          {isProcessing && (
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <View className="flex-row items-center justify-center">
                <Animated.View 
                  className="w-8 h-8 bg-green-100 rounded-full items-center justify-center mr-3"
                  style={{
                    transform: [{ scale: pulseAnim }],
                  }}
                >
                  <Ionicons name="leaf" size={16} color="#059669" />
                </Animated.View>
                <Text className="text-gray-600 font-medium">Analyzing crop diseases...</Text>
              </View>
            </View>
          )}

          {/* Available Crops */}
          <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Available Crops</Text>
            <Text className="text-gray-600 text-sm mb-4">We currently have disease information for these crops:</Text>
            {isLoadingCrops ? (
              <View className="flex-row items-center justify-center py-4">
                <Animated.View 
                  className="w-6 h-6 bg-green-100 rounded-full items-center justify-center mr-3"
                  style={{
                    transform: [{ scale: pulseAnim }],
                  }}
                >
                  <Ionicons name="leaf" size={12} color="#059669" />
                </Animated.View>
                <Text className="text-gray-600">Loading crops...</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {availableCrops.map((crop, index) => (
                  <View key={index} className="flex-row items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <View className="flex-row items-center">
                      <Ionicons name="leaf" size={20} color="#059669" />
                      <Text className="text-gray-900 font-medium ml-3 capitalize">{crop}</Text>
                    </View>
                    <Text className="text-gray-500 text-sm">Diseases available</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Features */}
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-4">How It Works</Text>
            <View className="space-y-4">
              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center mr-3 mt-1">
                  <Text className="text-green-600 font-bold text-sm">1</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">Enter Crop Name</Text>
                  <Text className="text-gray-600 text-sm">Type the name of your crop to get started</Text>
                </View>
              </View>
              
              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center mr-3 mt-1">
                  <Text className="text-green-600 font-bold text-sm">2</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">View Diseases</Text>
                  <Text className="text-gray-600 text-sm">See all common diseases for your crop with images</Text>
                </View>
              </View>
              
              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center mr-3 mt-1">
                  <Text className="text-green-600 font-bold text-sm">3</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">Select Disease</Text>
                  <Text className="text-gray-600 text-sm">Choose the disease that matches your crop's symptoms</Text>
                </View>
              </View>
              
              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center mr-3 mt-1">
                  <Text className="text-green-600 font-bold text-sm">4</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">Get Solutions</Text>
                  <Text className="text-gray-600 text-sm">Receive detailed treatment and prevention advice</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
