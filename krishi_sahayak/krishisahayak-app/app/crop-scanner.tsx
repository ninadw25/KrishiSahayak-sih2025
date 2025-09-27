import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
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
import Text from './components/Text';
import { chatApiService } from './utils/chatApiService';

const { width, height } = Dimensions.get('window');

interface PestDetectionResult {
  disease: string;
  confidence: number;
  severity: string;
  treatment: string;
  prevention: string[];
}

export default function CropScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectionResult, setDetectionResult] = useState<PestDetectionResult | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // Mock detection result
  const mockDetectionResult: PestDetectionResult = {
    disease: 'Powdery Mildew',
    confidence: 87,
    severity: 'Medium',
    treatment: 'Apply fungicide containing sulfur or neem oil. Remove infected plant parts.',
    prevention: [
      'Ensure proper air circulation',
      'Avoid overhead watering',
      'Plant disease-resistant varieties',
      'Maintain proper spacing between plants'
    ],
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera" size={64} color="#9ca3af" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to detect plant diseases and pests.
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
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;

    try {
      setIsAnalyzing(true);
      console.log('Analyzing image with real API...');
      
      // Call the real API for image analysis
      const analysisMessage = 'Analyze this plant image for diseases, pests, and provide detailed recommendations';
      const apiResponse = await chatApiService.sendImageAnalysis(capturedImage, analysisMessage);
      
      console.log('Received analysis response:', apiResponse);
      
      // Navigate to chat interface with the real analysis result
      router.push({
        pathname: '/chat-interface',
        params: {
          imageUri: capturedImage,
          analyzeMessage: analysisMessage,
          analysisResult: apiResponse.response
        }
      });
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      
      // Show error and navigate with fallback
      Alert.alert(
        'Analysis Error', 
        'Failed to analyze the image. You can still send it to chat for manual analysis.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Send to Chat',
            onPress: () => {
              router.push({
                pathname: '/chat-interface',
                params: {
                  imageUri: capturedImage,
                  analyzeMessage: 'Analyze this plant for diseases and pests'
                }
              });
            }
          }
        ]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
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
            <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Focus Frame */}
          <View style={styles.focusFrame}>
            <View style={styles.focusCorner} />
            <View style={[styles.focusCorner, styles.focusCornerTopRight]} />
            <View style={[styles.focusCorner, styles.focusCornerBottomLeft]} />
            <View style={[styles.focusCorner, styles.focusCornerBottomRight]} />
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Position the plant in the frame</Text>
            <Text style={styles.instructionsText}>
              Make sure the affected area is clearly visible
            </Text>
          </View>

          {/* Capture Button */}
          <View style={styles.captureContainer}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
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
          <Text style={styles.retakeButtonText}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.analyzeButton} onPress={analyzeImage}>
          <Text style={styles.analyzeButtonText}>Analyze in Chat</Text>
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
        <Text style={styles.analysisTitle}>Analyzing Image</Text>
        <Text style={styles.analysisSubtitle}>
          AI is identifying potential diseases and pests...
        </Text>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
        <Text style={styles.progressText}>This may take a few moments</Text>
      </View>
    </View>
  );

  const renderDetectionResult = () => {
    if (!detectionResult) return null;

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

    return (
      <ScrollView style={styles.resultContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View style={styles.diseaseIcon}>
              <Ionicons name="bug" size={24} color="#ef4444" />
            </View>
            <View style={styles.diseaseInfo}>
              <Text style={styles.diseaseName}>{detectionResult.disease}</Text>
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
        </View>

        <View style={styles.treatmentCard}>
          <Text style={styles.cardTitle}>Treatment</Text>
          <Text style={styles.treatmentText}>{detectionResult.treatment}</Text>
        </View>

        <View style={styles.preventionCard}>
          <Text style={styles.cardTitle}>Prevention Tips</Text>
          {detectionResult.prevention.map((tip, index) => (
            <View key={index} style={styles.preventionItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.preventionText}>{tip}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.newDetectionButton} onPress={retakePicture}>
          <Text style={styles.newDetectionButtonText}>Detect Another Plant</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}

      {!capturedImage && !isAnalyzing && !detectionResult && renderCameraView()}
      {capturedImage && !isAnalyzing && !detectionResult && renderImagePreview()}
      {isAnalyzing && renderAnalysisProgress()}
      {detectionResult && renderDetectionResult()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 24,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraContainer: {
    flex: 1,
    margin: 24,
    borderRadius: 16,
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
    top: 24,
    right: 24,
    zIndex: 1,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusFrame: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    bottom: '30%',
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
    top: '20%',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  instructionsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionsText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.9,
  },
  captureContainer: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  previewContainer: {
    flex: 1,
    margin: 24,
  },
  previewImage: {
    flex: 1,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 16,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  analyzeButton: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  analysisCard: {
    marginHorizontal: 24,
    marginVertical: 8,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
  },
  analysisContent: {
    alignItems: 'center',
  },
  loadingIcon: {
    marginBottom: 24,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  analysisSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    width: '80%',
    backgroundColor: '#059669',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
  },
  resultContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  diseaseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  diseaseInfo: {
    flex: 1,
  },
  diseaseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  confidenceContainer: {
    flexDirection: 'row',
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  severityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  treatmentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  preventionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  treatmentText: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  preventionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  preventionText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  newDetectionButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  newDetectionButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});