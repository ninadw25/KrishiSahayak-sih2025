import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { useFonts } from 'expo-font';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import './globals.css';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'DM-Regular': DMSans_400Regular,
    'DM-Medium': DMSans_500Medium,
    'DM-Bold': DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#ffffff',
            borderBottomWidth: 1,
            borderBottomColor: '#e5e7eb',
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#111827',
            fontFamily: 'DM-Bold', // Apply DM Sans Bold to all page titles
          },
          headerTintColor: '#059669',
        }}
      >
        <Stack.Screen 
          name="splash-screen" 
          options={{ 
            headerShown: false,
            presentation: 'modal',
            animation: 'fade'
          }} 
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="pest-detection" 
          options={{ 
            headerShown: true, 
            title: 'Pest Detection',
          }} 
        />
        <Stack.Screen 
          name="disease-detection" 
          options={{ 
            headerShown: true, 
            title: 'Disease Diagnosis',
          }} 
        />
        <Stack.Screen 
          name="weather-forecast" 
          options={{ 
            headerShown: true, 
            title: 'Weather Forecast',
          }} 
        />
      </Stack>
    </>
  );
}