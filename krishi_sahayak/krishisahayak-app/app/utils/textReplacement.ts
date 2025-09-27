// Utility to help replace all Text imports with our custom Text component
// This ensures DM Sans is applied globally

export const replaceTextImports = `
// Replace this:
import { Text } from 'react-native';

// With this:
import Text from '../components/Text';
// or
import Text from './components/Text';
// or
import Text from '@/components/Text';
`;

export const textReplacementGuide = `
# Text Replacement Guide

## Files that need Text import replacement:

1. app/(tabs)/crop-recommendations.tsx
2. app/(tabs)/market-insights.tsx  
3. app/(tabs)/profile.tsx
4. app/(tabs)/chat-interface.tsx
5. app/pest-detection.tsx
6. app/disease-detection.tsx
7. app/weather-forecast.tsx
8. app/crop-scanner.tsx
9. app/splash-screen.tsx

## Steps to fix:

1. Find: import { Text } from 'react-native';
2. Replace with: import Text from '../components/Text';
3. Update all <Text> components to use variant prop:
   - <Text> → <Text variant="regular">
   - <Text className="font-bold"> → <Text variant="bold">
   - <Text className="font-semibold"> → <Text variant="medium">
`;

export const commonTextPatterns = {
  // Regular text
  regular: '<Text variant="regular">',
  // Bold text  
  bold: '<Text variant="bold">',
  // Medium/Semibold text
  medium: '<Text variant="medium">',
  // Headers
  h1: '<Text variant="bold" className="text-3xl">',
  h2: '<Text variant="bold" className="text-2xl">',
  h3: '<Text variant="bold" className="text-xl">',
  // Body text
  body: '<Text variant="regular" className="text-base">',
  bodySmall: '<Text variant="regular" className="text-sm">',
  // Labels
  label: '<Text variant="medium" className="text-sm">',
  // Captions
  caption: '<Text variant="regular" className="text-xs">',
};
