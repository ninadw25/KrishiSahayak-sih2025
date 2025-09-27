import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { llmService, PestDetectionResult } from './utils/llmService';
import Text from './components/Text';
import { pestApiService, PestDetectionApiResponse } from './utils/pestApiService';

const { width, height } = Dimensions.get('window');

// Interfaces are now imported from llmService

export default function PestDetection() {
  const [permission, requestPermission] = useCameraPermissions();
  const [galleryPermission, requestGalleryPermission] = ImagePicker.useMediaLibraryPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectionResult, setDetectionResult] = useState<PestDetectionResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // Mock pest detection results with pesticide data
  const mockPestData: PestDetectionResult[] = [
    {
      pest: 'Aphids',
      confidence: 92,
      severity: 'Medium',
      description: 'Small, soft-bodied insects that feed on plant sap, commonly found on new growth and undersides of leaves.',
      damage: [
        'Yellowing and curling of leaves',
        'Stunted plant growth',
        'Honeydew secretion leading to sooty mold',
        'Transmission of plant viruses'
      ],
      pesticides: [
        {
          name: 'Neem Oil Spray',
          activeIngredient: 'Azadirachtin',
          dosage: '2-4 ml per liter of water',
          applicationMethod: 'Foliar spray, covering all plant surfaces',
          frequency: 'Every 7-10 days until infestation is controlled',
          safetyPrecautions: [
            'Apply in early morning or late evening',
            'Avoid spraying during flowering',
            'Wear protective clothing',
            'Keep away from children and pets'
          ],
          effectiveness: 85,
          price: '₹200-300 per 100ml'
        },
        {
          name: 'Pyrethrin Insecticide',
          activeIngredient: 'Pyrethrins',
          dosage: '1-2 ml per liter of water',
          applicationMethod: 'Direct spray on affected areas',
          frequency: 'Every 5-7 days, maximum 3 applications',
          safetyPrecautions: [
            'Do not apply in direct sunlight',
            'Wait 24 hours before harvest',
            'Use protective equipment',
            'Store in cool, dry place'
          ],
          effectiveness: 90,
          price: '₹150-250 per 50ml'
        },
        {
          name: 'Insecticidal Soap',
          activeIngredient: 'Potassium salts of fatty acids',
          dosage: '5-10 ml per liter of water',
          applicationMethod: 'Thoroughly wet all plant surfaces',
          frequency: 'Every 3-5 days as needed',
          safetyPrecautions: [
            'Test on small area first',
            'Apply when temperature is below 30°C',
            'Rinse with water after 2 hours',
            'Avoid contact with eyes'
          ],
          effectiveness: 75,
          price: '₹100-150 per 500ml'
        }
      ]
    },
    {
      pest: 'Whiteflies',
      confidence: 88,
      severity: 'High',
      description: 'Small, white-winged insects that feed on plant sap and can cause significant damage to crops.',
      damage: [
        'Yellowing and wilting of leaves',
        'Reduced plant vigor',
        'Honeydew production',
        'Transmission of viral diseases'
      ],
      pesticides: [
        {
          name: 'Imidacloprid Systemic',
          activeIngredient: 'Imidacloprid',
          dosage: '1-2 ml per liter of water',
          applicationMethod: 'Soil drench or foliar spray',
          frequency: 'Every 14-21 days',
          safetyPrecautions: [
            'Do not apply near water bodies',
            'Wait 21 days before harvest',
            'Use protective equipment',
            'Keep away from beneficial insects'
          ],
          effectiveness: 95,
          price: '₹300-500 per 100ml'
        },
        {
          name: 'Spinosad Organic',
          activeIngredient: 'Spinosad',
          dosage: '2-4 ml per liter of water',
          applicationMethod: 'Foliar spray covering all surfaces',
          frequency: 'Every 7-10 days',
          safetyPrecautions: [
            'Apply in evening hours',
            'Safe for beneficial insects',
            'Wait 1 day before harvest',
            'Store below 30°C'
          ],
          effectiveness: 88,
          price: '₹250-400 per 100ml'
        },
        {
          name: 'Yellow Sticky Traps',
          activeIngredient: 'Adhesive + Pheromone',
          dosage: '1 trap per 10 square meters',
          applicationMethod: 'Hang at plant height',
          frequency: 'Replace every 2-3 weeks',
          safetyPrecautions: [
            'Position away from beneficial insects',
            'Check traps regularly',
            'Dispose of used traps properly',
            'Keep out of reach of children'
          ],
          effectiveness: 70,
          price: '₹50-100 per trap'
        }
      ]
    },
    {
      pest: 'Caterpillars',
      confidence: 85,
      severity: 'High',
      description: 'Larval stage of moths and butterflies that feed on leaves, causing extensive defoliation.',
      damage: [
        'Holes in leaves and fruits',
        'Complete defoliation in severe cases',
        'Reduced photosynthesis',
        'Entry points for diseases'
      ],
      pesticides: [
        {
          name: 'Bacillus thuringiensis (Bt)',
          activeIngredient: 'Bacillus thuringiensis',
          dosage: '2-4 grams per liter of water',
          applicationMethod: 'Foliar spray on affected areas',
          frequency: 'Every 7-10 days',
          safetyPrecautions: [
            'Apply in evening for best results',
            'Safe for beneficial insects',
            'Store in refrigerator',
            'Use within 2 years of purchase'
          ],
          effectiveness: 92,
          price: '₹200-350 per 100g'
        },
        {
          name: 'Chlorantraniliprole',
          activeIngredient: 'Chlorantraniliprole',
          dosage: '0.5-1 ml per liter of water',
          applicationMethod: 'Foliar spray with good coverage',
          frequency: 'Every 14-21 days',
          safetyPrecautions: [
            'Do not apply in windy conditions',
            'Wait 14 days before harvest',
            'Use protective equipment',
            'Avoid contact with skin'
          ],
          effectiveness: 96,
          price: '₹400-600 per 50ml'
        },
        {
          name: 'Hand Picking + Neem',
          activeIngredient: 'Manual removal + Azadirachtin',
          dosage: '2-3 ml neem per liter water',
          applicationMethod: 'Remove caterpillars manually, spray neem',
          frequency: 'Daily inspection, spray every 3-5 days',
          safetyPrecautions: [
            'Wear gloves when hand picking',
            'Apply neem in evening',
            'Dispose of caterpillars safely',
            'Monitor regularly'
          ],
          effectiveness: 80,
          price: '₹150-250 per 100ml neem'
        }
      ]
    }
  ];

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="bug" size={64} color="#9ca3af" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to detect pests and recommend appropriate pesticides.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setCapturedImage(photo.uri);
        setDetectionResult(null);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setDetectionResult(null);
    setApiError(null);
  };

  const pickImageFromGallery = async () => {
    try {
      // Check gallery permissions
      if (!galleryPermission?.granted) {
        const permissionResult = await requestGalleryPermission();
        if (!permissionResult.granted) {
          Alert.alert('Permission Required', 'Gallery access is needed to select images for pest detection.');
          return;
        }
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        setDetectionResult(null);
        setApiError(null);
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      Alert.alert('Error', 'Failed to select image from gallery');
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    setApiError(null);
    
    try {
      console.log('Starting pest detection analysis...');
      console.log('Image URI:', capturedImage);
      
      // Call the FastAPI backend to detect pest
      const apiResponse: PestDetectionApiResponse = await pestApiService.detectPest(capturedImage);
      
      console.log('API Response:', apiResponse);
      console.log('Pest Name:', apiResponse.pestName);
      console.log('Pesticides:', apiResponse.pesticides);
      
      // Generate comprehensive pest data using LLM service
      console.log('Generating detailed pest information with LLM...');
      const pestResult = await llmService.generatePestDetectionResult(
        apiResponse.pestName, 
        apiResponse.pesticides
      );
      
      console.log('LLM generated pest result:', pestResult);
      setDetectionResult(pestResult);
      
    } catch (error) {
      console.error('Error analyzing pest:', error);
      
      // Show error to user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setApiError(errorMessage);
      
      // Fallback to mock data
      console.log('Falling back to mock data due to error');
      const randomPest = mockPestData[Math.floor(Math.random() * mockPestData.length)];
      setDetectionResult(randomPest);
      
      // Show alert about fallback
      Alert.alert(
        'API Error', 
        `Could not connect to pest detection API: ${errorMessage}. Showing sample data instead.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const testApiConnection = async () => {
    try {
      console.log('Testing API connection...');
      
      // Test basic connection first
      const isConnected = await pestApiService.testConnection();
      if (!isConnected) {
        Alert.alert('Error', 'Basic API connection failed. Please check your server.');
        return;
      }
      
      // Test pest detection endpoint
      const pestEndpointWorking = await pestApiService.testPestDetectionEndpoint();
      if (pestEndpointWorking) {
        Alert.alert('Success', 'API connection and pest detection endpoint are working!');
      } else {
        Alert.alert('Warning', 'API is connected but pest detection endpoint has issues. Check the endpoint implementation.');
      }
    } catch (error) {
      console.error('API test error:', error);
      Alert.alert('Error', `API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testWithSampleImage = async () => {
    try {
      console.log('Testing with sample image...');
      setIsAnalyzing(true);
      setApiError(null);
      
      // Create a sample data URI for testing
      const sampleImageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      // Call the API with sample image
      const apiResponse = await pestApiService.detectPest(sampleImageUri);
      console.log('Sample API Response:', apiResponse);
      
      // Generate LLM data
      const pestResult = await llmService.generatePestDetectionResult(
        apiResponse.pestName, 
        apiResponse.pesticides
      );
      
      setDetectionResult(pestResult);
      Alert.alert('Success', 'Sample test completed! Check the results below.');
      
    } catch (error) {
      console.error('Sample test error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setApiError(errorMessage);
      Alert.alert('Error', `Sample test failed: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderCameraView = () => (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="picture"
      >
        <View style={styles.cameraOverlay}>
          {/* Camera Controls */}
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.controlButton} onPress={testApiConnection}>
              <Ionicons name="wifi" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlButton, { marginTop: 12 }]} onPress={testWithSampleImage}>
              <Ionicons name="flask" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlButton, { marginTop: 12 }]} onPress={pickImageFromGallery}>
              <Ionicons name="images" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlButton, { marginTop: 12 }]} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Square Focus Frame */}
          <View style={styles.squareFocusFrame}>
            <View style={styles.focusCorner} />
            <View style={[styles.focusCorner, styles.focusCornerTopRight]} />
            <View style={[styles.focusCorner, styles.focusCornerBottomLeft]} />
            <View style={[styles.focusCorner, styles.focusCornerBottomRight]} />
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Detect Pests</Text>
            <Text style={styles.instructionsText}>
              Take a photo or select from gallery
            </Text>
          </View>

          {/* Capture Button */}
          <View style={styles.captureContainer}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <Text style={styles.captureHint}>Tap to capture • Gallery button above</Text>
          </View>
        </View>
      </CameraView>
    </View>
  );

  const renderImagePreview = () => (
    <View style={styles.previewContainer}>
      <Image source={{ uri: capturedImage! }} style={styles.previewImage} />
      <View style={styles.previewControls}>
        <TouchableOpacity style={styles.retakeButton} onPress={retakePicture}>
          <Ionicons name="camera" size={16} color="#374151" />
          <Text style={styles.retakeButtonText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryButton} onPress={pickImageFromGallery}>
          <Ionicons name="images" size={16} color="#374151" />
          <Text style={styles.galleryButtonText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.analyzeButton} onPress={analyzeImage}>
          <Ionicons name="search" size={16} color="white" />
          <Text style={styles.analyzeButtonText}>Analyze</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAnalysisProgress = () => (
    <View style={styles.analysisCard}>
      <View style={styles.analysisContent}>
        <View style={styles.loadingIcon}>
          <Ionicons name="search" size={40} color="#059669" />
        </View>
        <Text style={styles.analysisTitle}>Analyzing Pest</Text>
        <Text style={styles.analysisSubtitle}>
          AI is identifying the pest and finding suitable pesticides...
        </Text>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
        <Text style={styles.progressText}>This may take a few moments</Text>
      </View>
    </View>
  );

  const renderApiError = () => {
    if (!apiError) return null;

    return (
      <View style={styles.errorCard}>
        <View style={styles.errorContent}>
          <Ionicons name="warning" size={32} color="#ef4444" />
          <Text style={styles.errorTitle}>API Connection Error</Text>
          <Text style={styles.errorMessage}>{apiError}</Text>
          <Text style={styles.errorSubtext}>
            Showing sample data for demonstration purposes.
          </Text>
        </View>
      </View>
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Low':
        return '#10b981';
      case 'Medium':
        return '#f59e0b';
      case 'High':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getEffectivenessColor = (effectiveness: number) => {
    if (effectiveness >= 90) return '#10b981';
    if (effectiveness >= 80) return '#f59e0b';
    return '#ef4444';
  };

  const renderDetectionResult = () => {
    if (!detectionResult) return null;

    return (
      <ScrollView style={styles.resultContainer} showsVerticalScrollIndicator={false}>
        {/* Pest Information */}
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View style={styles.pestIcon}>
              <Ionicons name="bug" size={24} color="#ef4444" />
            </View>
            <View style={styles.pestInfo}>
              <Text style={styles.pestName}>{detectionResult.pest}</Text>
              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceLabel}>Confidence: </Text>
                <Text style={styles.confidenceValue}>{detectionResult.confidence}%</Text>
              </View>
            </View>
          </View>

          <View style={styles.severityContainer}>
            <Text style={styles.severityLabel}>Severity:</Text>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(detectionResult.severity) }]}>
              <Text style={styles.severityText}>{detectionResult.severity}</Text>
            </View>
          </View>

          <Text style={styles.pestDescription}>{detectionResult.description}</Text>
        </View>

        {/* Damage Information */}
        <View style={styles.damageCard}>
          <Text style={styles.cardTitle}>Damage Caused</Text>
          {detectionResult.damage.map((damage, index) => (
            <View key={index} style={styles.damageItem}>
              <Ionicons name="warning" size={16} color="#f59e0b" />
              <Text style={styles.damageText}>{damage}</Text>
            </View>
          ))}
        </View>

        {/* Pesticide Recommendations */}
        <View style={styles.pesticidesCard}>
          <Text style={styles.cardTitle}>Recommended Pesticides</Text>
          {detectionResult.pesticides.map((pesticide, index) => (
            <View key={index} style={styles.pesticideItem}>
              <View style={styles.pesticideHeader}>
                <Text style={styles.pesticideName}>{pesticide.name}</Text>
                <View style={styles.effectivenessContainer}>
                  <Text style={styles.effectivenessLabel}>Effectiveness: </Text>
                  <Text style={[styles.effectivenessValue, { color: getEffectivenessColor(pesticide.effectiveness) }]}>
                    {pesticide.effectiveness}%
                  </Text>
                </View>
              </View>

              <View style={styles.pesticideDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="flask" size={16} color="#6b7280" />
                  <Text style={styles.detailLabel}>Active Ingredient: </Text>
                  <Text style={styles.detailValue}>{pesticide.activeIngredient}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="water" size={16} color="#6b7280" />
                  <Text style={styles.detailLabel}>Dosage: </Text>
                  <Text style={styles.detailValue}>{pesticide.dosage}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="construct" size={16} color="#6b7280" />
                  <Text style={styles.detailLabel}>Application: </Text>
                  <Text style={styles.detailValue}>{pesticide.applicationMethod}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="time" size={16} color="#6b7280" />
                  <Text style={styles.detailLabel}>Frequency: </Text>
                  <Text style={styles.detailValue}>{pesticide.frequency}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="cash" size={16} color="#6b7280" />
                  <Text style={styles.detailLabel}>Price: </Text>
                  <Text style={styles.detailValue}>{pesticide.price}</Text>
                </View>
              </View>

              <View style={styles.safetyPrecautions}>
                <Text style={styles.safetyTitle}>Safety Precautions:</Text>
                {pesticide.safetyPrecautions.map((precaution, idx) => (
                  <View key={idx} style={styles.precautionItem}>
                    <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                    <Text style={styles.precautionText}>{precaution}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.newDetectionButton} onPress={retakePicture}>
          <Text style={styles.newDetectionButtonText}>Detect Another Pest</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {!capturedImage && !isAnalyzing && !detectionResult && renderCameraView()}
      {capturedImage && !isAnalyzing && !detectionResult && renderImagePreview()}
      {isAnalyzing && renderAnalysisProgress()}
      {detectionResult && (
        <>
          {renderApiError()}
          {renderDetectionResult()}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  permissionTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 28,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 17,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraControls: {
    position: 'absolute',
    top: 28,
    right: 28,
    zIndex: 1,
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareFocusFrame: {
    position: 'absolute',
    top: '25%',
    left: '15%',
    right: '15%',
    bottom: '45%',
  },
  focusCorner: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderColor: 'white',
  },
  focusCornerTopRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  focusCornerBottomLeft: {
    bottom: 0,
    top: 'auto',
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  focusCornerBottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  instructionsContainer: {
    position: 'absolute',
    top: '12%',
    left: 28,
    right: 28,
    alignItems: 'center',
  },
  instructionsTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  instructionsText: {
    color: 'white',
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.95,
    lineHeight: 22,
  },
  captureContainer: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
  },
  captureHint: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.8,
  },
  previewContainer: {
    flex: 1,
    margin: 20,
  },
  previewImage: {
    flex: 1,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  retakeButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  galleryButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  galleryButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  analyzeButton: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  analysisCard: {
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  analysisContent: {
    alignItems: 'center',
  },
  loadingIcon: {
    marginBottom: 28,
  },
  analysisTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  analysisSubtitle: {
    fontSize: 17,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    width: '80%',
    backgroundColor: '#059669',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 15,
    color: '#6b7280',
  },
  resultContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  pestIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  pestInfo: {
    flex: 1,
  },
  pestName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 15,
    color: '#6b7280',
  },
  confidenceValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#059669',
  },
  severityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  severityLabel: {
    fontSize: 15,
    color: '#6b7280',
    marginRight: 10,
  },
  severityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  severityText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pestDescription: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
  },
  damageCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  damageItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingVertical: 4,
  },
  damageText: {
    fontSize: 15,
    color: '#6b7280',
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  pesticidesCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pesticideItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pesticideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pesticideName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  effectivenessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  effectivenessLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  effectivenessValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  pesticideDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 2,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    marginRight: 6,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  safetyPrecautions: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  precautionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingVertical: 2,
  },
  precautionText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  newDetectionButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#059669',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  newDetectionButtonText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '600',
  },
  errorCard: {
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorContent: {
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#7f1d1d',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  errorSubtext: {
    fontSize: 12,
    color: '#991b1b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});