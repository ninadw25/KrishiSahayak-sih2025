import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Clipboard,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Vibration,
  View
} from 'react-native';
import Text from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chatApiService } from '../utils/chatApiService';
import { permissionManager } from '../utils/permissions';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'action' | 'image';
  imageUri?: string;
  isLiked?: boolean;
  isCopied?: boolean;
}

export default function ChatInterface() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI farming assistant. How can I help you today?',
      isUser: false,
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Initialize audio permissions
  useEffect(() => {
    const checkPermissions = async () => {
      const micPermission = await permissionManager.checkMicrophonePermission();
      if (!micPermission.granted && micPermission.canAskAgain) {
        const newPermission = await permissionManager.requestMicrophonePermission();
        if (!newPermission.granted) {
          permissionManager.showPermissionAlert('microphone');
        }
      } else if (!micPermission.granted && !micPermission.canAskAgain) {
        permissionManager.showPermissionAlert('microphone');
      }
    };
    checkPermissions();
  }, []);

  // Handle incoming image from crop scanner
  useEffect(() => {
    if (params.imageUri && params.analyzeMessage) {
      // Add image message
      const imageMessage: Message = {
        id: Date.now().toString(),
        text: '',
        isUser: true,
        timestamp: new Date(),
        type: 'image',
        imageUri: params.imageUri as string
      };

      // Add analyze message
      const analyzeMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: params.analyzeMessage as string,
        isUser: true,
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, imageMessage, analyzeMessage]);
      
      // If we have a pre-analyzed result, show it immediately
      if (params.analysisResult) {
        const analysisResponse: Message = {
          id: (Date.now() + 2).toString(),
          text: params.analysisResult as string,
          isUser: false,
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, analysisResponse]);
      } else {
        // Auto-send analysis request if no pre-analyzed result
        setTimeout(() => {
          handleImageAnalysis(params.imageUri as string);
        }, 1000);
      }
    }
  }, [params.imageUri, params.analyzeMessage, params.analysisResult]);

  // Recording animation effects
  useEffect(() => {
    if (isRecording) {
      // Pulse animation
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

      // Wave animation
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();

      // Recording duration counter
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      pulseAnim.setValue(1);
      waveAnim.setValue(0);
      setRecordingDuration(0);
    }
  }, [isRecording]);

  const quickQuestions = useMemo(() => [
    'What crops should I plant this season?',
    'How to treat leaf blight?',
    'Weather forecast for next week',
    'Best time to harvest rice',
    'Soil testing recommendations',
    'Pest control for tomatoes'
  ], []);

  const suggestions = useMemo(() => [
    // {
    //   title: 'Crop Planning',
    //   description: 'Get personalized crop recommendations',
    //   icon: 'leaf-outline',
    //   action: 'crop_planning'
    // },
    {
      title: 'Disease Diagnosis',
      description: 'Upload photo for disease identification',
      icon: 'camera-outline',
      action: 'disease_diagnosis'
    },
    {
      title: 'Pest Detection',
      description: 'Identify pests and get pesticide recommendations',
      icon: 'bug-outline',
      action: 'pest_detection'
    },
    // {
    //   title: 'Market Prices',
    //   description: 'View current crop prices',
    //   icon: 'trending-up-outline',
    //   action: 'market_prices'
    // }
  ], []);

  const handleSendMessage = useCallback(async () => {
    if (inputText.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);
    setApiError(null);

    try {
      console.log('Sending message to chat API...');
      
      // Convert current messages to API format
      const conversationHistory = chatApiService.convertMessagesToApiFormat(messages);
      
      // Call the real API
      const apiResponse = await chatApiService.sendMessage(currentInput, conversationHistory);
      
      console.log('Received API response:', apiResponse);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: apiResponse.response,
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
    } catch (error) {
      console.error('Error sending message to API:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
      setApiError(errorMessage);
      
      // Show error to user
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `Sorry, I'm having trouble connecting to the server. Error: ${errorMessage}. Please try again later.`,
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  }, [inputText, messages]);

  const startRecording = async () => {
    try {
      // Check microphone permission first
      const micPermission = await permissionManager.checkMicrophonePermission();
      if (!micPermission.granted) {
        if (micPermission.canAskAgain) {
          const newPermission = await permissionManager.requestMicrophonePermission();
          if (!newPermission.granted) {
            permissionManager.showPermissionAlert('microphone');
            return;
          }
        } else {
          permissionManager.showPermissionAlert('microphone');
          return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
      Vibration.vibrate(50);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      setIsRecording(false);
      Vibration.vibrate(100);

      if (uri) {
        // Simulate voice-to-text conversion
        const transcribedText = await simulateVoiceToText();
        if (transcribedText) {
          setInputText(transcribedText);
          // Auto-send the transcribed message
          setTimeout(() => {
            handleSendMessage();
          }, 500);
        }
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to process recording. Please try again.');
    }
  };

  const simulateVoiceToText = async (): Promise<string> => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return a sample transcribed text based on common farming queries
    const sampleTexts = [
      "What's the best time to plant tomatoes?",
      "How do I treat aphids on my crops?",
      "What fertilizer should I use for rice?",
      "Is it going to rain tomorrow?",
      "How to prevent root rot in plants?",
      "What's the current price of wheat?"
    ];
    
    return sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
  };

  const handleMessageAction = (messageId: string, action: 'like' | 'copy' | 'speak') => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        switch (action) {
          case 'like':
            return { ...msg, isLiked: !msg.isLiked };
          case 'copy':
            Clipboard.setString(msg.text);
            Vibration.vibrate(50);
            return { ...msg, isCopied: true };
          case 'speak':
            if (!msg.isUser) {
              Speech.speak(msg.text, { language: 'en' });
            }
            return msg;
          default:
            return msg;
        }
      }
      return msg;
    }));

    if (action === 'copy') {
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isCopied: false } : msg
        ));
      }, 2000);
    }
  };

  const handleImageAnalysis = async (imageUri: string) => {
    setIsTyping(true);
    setApiError(null);
    
    try {
      console.log('Sending image for analysis to chat API...');
      
      const analysisMessage = 'Analyze this plant image for diseases, pests, and provide recommendations';
      const apiResponse = await chatApiService.sendImageAnalysis(imageUri, analysisMessage);
      
      console.log('Received image analysis response:', apiResponse);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: apiResponse.response,
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze image';
      setApiError(errorMessage);
      
      // Show error to user
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `Sorry, I'm having trouble analyzing the image. Error: ${errorMessage}. Please try again later.`,
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };


  const handleQuickQuestion = useCallback(async (question: string) => {
    setInputText(question);
    await handleSendMessage();
  }, [handleSendMessage]);

  const handleSuggestion = useCallback((action: string) => {
    if (action === 'disease_diagnosis') {
      // Navigate to disease detection page
      router.push('/disease-detection');
      return;
    }

    if (action === 'pest_detection') {
      // Navigate to pest detection page
      router.push('/pest-detection');
      return;
    }

    let response = '';
    switch (action) {
      case 'crop_planning':
        response = 'I\'ll help you with crop planning. Please tell me about your farm size, soil type, and preferred growing season.';
        break;
      case 'market_prices':
        response = 'Current market prices: Rice ₹2,850/quintal, Wheat ₹2,150/quintal, Sugarcane ₹3,200/quintal. Prices are trending upward for rice and sugarcane.';
        break;
    }

    const suggestionMessage: Message = {
      id: Date.now().toString(),
      text: response,
      isUser: false,
      timestamp: new Date(),
      type: 'suggestion'
    };

    setMessages(prev => [...prev, suggestionMessage]);
  }, [router]);

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const renderMessage = useCallback((message: Message) => {
    if (message.type === 'image') {
      return (
        <View key={message.id} className="mb-4 items-end">
          <View className="max-w-[80%] bg-green-600 rounded-2xl rounded-br-md p-2">
            <Image 
              source={{ uri: message.imageUri }} 
              className="w-48 h-48 rounded-xl"
              resizeMode="cover"
            />
            <Text className="text-green-100 text-xs mt-1 text-right">
              {formatTime(message.timestamp)}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View key={message.id} className={`mb-4 ${message.isUser ? 'items-end' : 'items-start'}`}>
        <View className={`max-w-[80%] ${
          message.isUser 
            ? 'bg-green-600 rounded-2xl rounded-br-md' 
            : 'bg-white rounded-2xl rounded-bl-md shadow-sm'
        } p-4`}>
          <Text className={`text-sm leading-5 ${
            message.isUser ? 'text-white' : 'text-gray-900'
          }`}>
            {message.text}
          </Text>
          
          <View className="flex-row items-center justify-between mt-2">
            <Text className={`text-xs ${
            message.isUser ? 'text-green-100' : 'text-gray-500'
          }`}>
            {formatTime(message.timestamp)}
          </Text>
            
            {!message.isUser && (
              <View className="flex-row items-center space-x-2 ml-2">
                <Pressable
                  onPress={() => handleMessageAction(message.id, 'like')}
                  className="p-1"
                  accessibilityLabel={message.isLiked ? "Unlike message" : "Like message"}
                  accessibilityRole="button"
                >
                  <Ionicons 
                    name={message.isLiked ? 'heart' : 'heart-outline'} 
                    size={16} 
                    color={message.isLiked ? '#ef4444' : '#9ca3af'} 
                  />
                </Pressable>
                
                <Pressable
                  onPress={() => handleMessageAction(message.id, 'copy')}
                  className="p-1"
                  accessibilityLabel={message.isCopied ? "Copied to clipboard" : "Copy message"}
                  accessibilityRole="button"
                >
                  <Ionicons 
                    name={message.isCopied ? 'checkmark' : 'copy-outline'} 
                    size={16} 
                    color={message.isCopied ? '#059669' : '#9ca3af'} 
                  />
                </Pressable>
                
                <Pressable
                  onPress={() => handleMessageAction(message.id, 'speak')}
                  className="p-1"
                  accessibilityLabel="Read message aloud"
                  accessibilityRole="button"
                >
                  <Ionicons 
                    name="volume-high-outline" 
                    size={16} 
                    color="#9ca3af" 
                  />
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }, [formatTime, handleMessageAction]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 px-6 py-4"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => renderMessage(message))}

          {/* API Error Display */}
          {apiError && (
            <View className="mb-4 items-center">
              <View className="bg-red-50 border border-red-200 rounded-xl p-4 max-w-[80%]">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="warning" size={20} color="#dc2626" />
                  <Text className="text-red-800 font-semibold ml-2">Connection Error</Text>
                </View>
                <Text className="text-red-700 text-sm">{apiError}</Text>
                <TouchableOpacity 
                  onPress={() => setApiError(null)}
                  className="mt-2 self-end"
                >
                  <Text className="text-red-600 text-xs">Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {isTyping && (
            <View className="mb-4 items-start">
              <View className="bg-white rounded-2xl rounded-bl-md shadow-sm p-4">
                <View className="flex-row items-center space-x-2">
                  <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center">
                    <Ionicons name="leaf" size={16} color="#059669" />
                  </View>
                <View className="flex-row space-x-1">
                    <Animated.View 
                      className="w-2 h-2 bg-green-400 rounded-full"
                      style={{
                        opacity: pulseAnim,
                      }}
                    />
                    <Animated.View 
                      className="w-2 h-2 bg-green-400 rounded-full"
                      style={{
                        opacity: waveAnim,
                      }}
                    />
                    <Animated.View 
                      className="w-2 h-2 bg-green-400 rounded-full"
                      style={{
                        opacity: pulseAnim,
                      }}
                    />
                  </View>
                  <Text className="text-gray-500 text-xs ml-2">AI is thinking...</Text>
                </View>
              </View>
            </View>
          )}

          {/* Quick Questions - only show if no image analysis */}
          {messages.length === 1 && !params.imageUri && (
            <View className="">
              <Text className="text-gray-600 text-sm mb-3">Quick Questions:</Text>
              <View className="space-y-2">
                {quickQuestions.map((question, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleQuickQuestion(question)}
                    className="bg-white rounded-xl p-3 border border-gray-200"
                  >
                    <Text className="text-gray-700 text-sm">{question}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Suggestions */}
          <View className="mb-6">
            <Text className="text-gray-600 text-sm mb-3">Quick Actions:</Text>
            <View className="grid grid-cols-2 gap-3">
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSuggestion(suggestion.action)}
                  className="bg-white rounded-xl p-4 border border-gray-200 items-center"
                >
                  <Ionicons name={suggestion.icon as any} size={24} color="#059669" />
                  <Text className="font-semibold text-gray-900 text-sm mt-2 text-center">
                    {suggestion.title}
                  </Text>
                  <Text className="text-gray-600 text-xs text-center mt-1">
                    {suggestion.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Input Area */}
        <View className="px-6 py-4 bg-white border-t border-gray-100">
          <View className="flex-row items-end space-x-3">
            <TouchableOpacity
              onPress={() => router.push('/crop-scanner')}
              className="w-12 h-12 rounded-full items-center justify-center shadow-sm bg-blue-100 border border-blue-200"
              accessibilityLabel="Open camera"
              accessibilityHint="Tap to open camera for plant scanning"
              accessibilityRole="button"
            >
              <Ionicons 
                name="camera" 
                size={20} 
                color="#3b82f6" 
              />
            </TouchableOpacity>
            <View className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200">
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask me anything about farming..."
                placeholderTextColor="#9ca3af"
                multiline
                className="text-gray-900 text-base max-h-20"
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
                blurOnSubmit={false}
              />
            </View>
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={inputText.trim() === ''}
              className={`w-12 h-12 rounded-full items-center justify-center shadow-sm ${
                inputText.trim() === '' 
                  ? 'bg-gray-200' 
                  : 'bg-green-600 shadow-green-200'
              }`}
              accessibilityLabel="Send message"
              accessibilityHint="Tap to send your message"
              accessibilityRole="button"
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={inputText.trim() === '' ? '#9ca3af' : 'white'} 
              />
            </TouchableOpacity>
          </View>
          
          {/* Voice Input */}
          <View className="flex-row justify-center mt-3">
            <Pressable
              onPressIn={startRecording}
              onPressOut={stopRecording}
              className={`flex-row items-center px-6 py-3 rounded-full ${
                isRecording 
                  ? 'bg-red-100 border-2 border-red-300' 
                  : 'bg-green-50 border border-green-200'
              }`}
              accessibilityLabel={isRecording ? "Stop recording" : "Start voice recording"}
              accessibilityHint={isRecording ? "Release to stop recording" : "Press and hold to record voice message"}
              accessibilityRole="button"
            >
              <Animated.View
                style={{
                  transform: [{ scale: isRecording ? pulseAnim : 1 }],
                }}
              >
                <Ionicons 
                  name={isRecording ? "stop" : "mic"} 
                  size={20} 
                  color={isRecording ? "#dc2626" : "#059669"} 
                />
              </Animated.View>
              
              <Text className={`text-sm ml-3 font-medium ${
                isRecording ? 'text-red-700' : 'text-green-700'
              }`}>
                {isRecording 
                  ? `Recording... ${recordingDuration}s` 
                  : 'Hold to speak'
                }
              </Text>
              
              {isRecording && (
                <Animated.View
                  className="ml-2"
                  style={{
                    opacity: waveAnim,
                  }}
                >
                  <View className="flex-row space-x-1">
                    <View className="w-1 h-4 bg-red-400 rounded-full" />
                    <View className="w-1 h-3 bg-red-400 rounded-full" />
                    <View className="w-1 h-5 bg-red-400 rounded-full" />
                    <View className="w-1 h-2 bg-red-400 rounded-full" />
                    <View className="w-1 h-4 bg-red-400 rounded-full" />
                  </View>
                </Animated.View>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}