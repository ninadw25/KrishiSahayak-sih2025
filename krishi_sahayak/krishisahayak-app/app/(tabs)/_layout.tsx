import { Ionicons } from '@expo/vector-icons';
import { Tabs } from "expo-router";
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 64,
          elevation: 0,
          shadowColor: 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          fontFamily: 'DM-Medium', // Apply DM Sans to tab labels
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        headerStyle: {
          backgroundColor: '#ffffff',
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#111827',
          fontFamily: 'DM-Bold', // Apply DM Sans Bold to page titles
        },
        headerTintColor: '#059669',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={size} 
              color={color} 
            />
          ),
          headerTitle: 'KrishiSahayak',
        }}
      />
        <Tabs.Screen
          name="crop-recommendations"
          options={{
            title: 'Crops',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? 'bulb' : 'bulb-outline'} 
                size={size} 
                color={color} 
              />
            ),
            headerTitle: 'Crop Recommendations',
          }}
        />
      <Tabs.Screen
        name="chat-interface"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'} 
              size={size} 
              color={color} 
            />
          ),
          headerTitle: 'AI Chatbot',
        }}
      />
      <Tabs.Screen
        name="market-insights"
        options={{
          title: 'Market',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'trending-up' : 'trending-up-outline'} 
              size={size} 
              color={color} 
            />
          ),
          headerTitle: 'Market Insights',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              size={size} 
              color={color} 
            />
          ),
          headerTitle: 'Profile',
        }}
      />
    </Tabs>
  );
}