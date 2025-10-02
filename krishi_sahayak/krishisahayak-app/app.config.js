export default {
  expo: {
    name: "KrishiSahayak",
    slug: "farmula",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || "AIzaSyBrEHwOV0v6KMM7oqqOkhLYmugVSKhk9E4",
      // Updated to use IP address instead of localhost for mobile device access
      fastapiApiUrl: process.env.EXPO_PUBLIC_FASTAPI_API_URL || "http://192.168.0.102:8000/api"
    }
  }
};
