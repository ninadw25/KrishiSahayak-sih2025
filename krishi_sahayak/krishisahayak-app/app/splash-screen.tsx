import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from './components/Text';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current; // Start slightly smaller
  const textTranslateAnim = useRef(new Animated.Value(20)).current; // Gentle slide up
  const progressAnim = useRef(new Animated.Value(0)).current;
  const backgroundProgressAnim = useRef(new Animated.Value(0)).current; // For background color transition

  useEffect(() => {
    startSplashSequence();
  }, []);

  const startSplashSequence = () => {
    // Sequence animations
    Animated.sequence([
      // Initial fade in of the whole screen
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        // Logo scale in (subtle bounce)
        Animated.spring(logoScaleAnim, {
          toValue: 1,
          tension: 120, // Softer bounce
          friction: 10,
          useNativeDriver: true,
        }),
        // Text slide up
        Animated.timing(textTranslateAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
        // Background color transition
        Animated.timing(backgroundProgressAnim, {
            toValue: 1,
            duration: 1500, // Slower background transition
            useNativeDriver: false,
        })
      ]),
      // Progress bar animation
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1800, // Adjusted duration
        useNativeDriver: false,
      }),
    ]).start(() => {
      // Exit after all animations complete
      setTimeout(() => {
        exitSplashSequence();
      }, 500); // Short delay before exit
    });
  };

  const exitSplashSequence = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(logoScaleAnim, {
        toValue: 1.1, // Slight final scale out
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateAnim, {
        toValue: -20, // Slide off screen
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.replace('/(tabs)/');
    });
  };

  const backgroundColorInterpolation = backgroundProgressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#f0fdf4', '#dcfce7'], // Subtle light green to slightly darker light green
  });


  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.container, { backgroundColor: backgroundColorInterpolation }]}>
        <Animated.View 
          style={[styles.contentWrapper, { opacity: fadeAnim }]}
        >
          {/* Logo */}
          <Animated.View 
            style={[styles.logoContainer, { transform: [{ scale: logoScaleAnim }] }]}
          >
            {/* Subtle inner glow */}
            <View style={styles.logoInnerGlow} />
            
            {/* Main Logo */}
            <View style={styles.mainLogo}>
              <Ionicons name="leaf" size={40} color="white" />
            </View>
          </Animated.View>

          {/* App Name & Tagline */}
          <Animated.View
            style={[styles.textContainer, { transform: [{ translateY: textTranslateAnim }] }]}
          >
            <Text style={styles.appName}>
              KrishiSahayak
            </Text>
            <View style={styles.appNameUnderline} />
            <Text style={styles.appTagline}>
              Your AI-Powered Farming Companion
            </Text>
          </Animated.View>

          {/* Progress Bar */}
          <Animated.View 
            style={[
                styles.progressBarContainer, 
                { opacity: fadeAnim } // Link progress bar visibility to overall fade
            ]}
          >
            <View style={styles.progressBarBackground}>
              <Animated.View 
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  }
                ]}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32, // Equivalent to px-8
    },
    contentWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    logoContainer: {
        position: 'relative',
        marginBottom: 48, // Increased margin for cleaner separation
    },
    logoInnerGlow: {
        position: 'absolute',
        top: 8, // Adjust to be more inside
        left: 8,
        right: 8,
        bottom: 8,
        backgroundColor: 'rgba(52, 211, 153, 0.2)', // green-400 with less opacity
        borderRadius: 9999, // full rounded
        // Removed blur to make it sleek
    },
    mainLogo: {
        width: 80, // Slightly smaller
        height: 80,
        backgroundColor: '#10B981', // green-500
        borderRadius: 9999,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10, // For Android shadow
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    appName: {
        fontSize: 48, // Slightly smaller
        fontWeight: '900', // black
        color: '#1F2937', // gray-900
        marginBottom: 8,
        letterSpacing: -1, // tracking-tight
    },
    appNameUnderline: {
        height: 4, // Slightly thicker
        width: 64, // Slightly shorter
        backgroundColor: '#10B981', // green-500
        borderRadius: 9999,
        marginBottom: 16, // Increased margin
    },
    appTagline: {
        fontSize: 18,
        color: '#4B5563', // gray-600
        fontWeight: '500',
        textAlign: 'center',
    },
    progressBarContainer: {
        width: '100%',
        maxWidth: 280, // max-w-xs equivalent
        marginTop: 24, // Margin top
    },
    progressBarBackground: {
        height: 6, // Thinner
        backgroundColor: 'rgba(255,255,255,0.3)', // white/30
        borderRadius: 9999,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#10B981', // green-500
        borderRadius: 9999,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
});