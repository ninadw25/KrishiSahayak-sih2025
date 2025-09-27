import { ScrollView, View } from 'react-native';
import { fonts, typography } from '../utils/fonts';
import Typography from './Typography';

export default function FontGuide() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6 space-y-6">
        
        {/* Typography Component Usage */}
        <View className="bg-white p-4 rounded-xl">
          <Typography variant="h3" className="mb-4">Typography Component (Recommended)</Typography>
          <Typography variant="h1">Heading 1</Typography>
          <Typography variant="h2">Heading 2</Typography>
          <Typography variant="h3">Heading 3</Typography>
          <Typography variant="h4">Heading 4</Typography>
          <Typography variant="h5">Heading 5</Typography>
          <Typography variant="h6">Heading 6</Typography>
          <Typography variant="bodyLarge">Body Large</Typography>
          <Typography variant="body">Body Text</Typography>
          <Typography variant="bodySmall">Body Small</Typography>
          <Typography variant="label">Label Text</Typography>
          <Typography variant="caption">Caption Text</Typography>
        </View>

        {/* Direct Style Usage */}
        <View className="bg-white p-4 rounded-xl">
          <Typography variant="h3" className="mb-4">Direct Style Usage</Typography>
          <Typography style={typography.h1}>Heading 1 (Direct)</Typography>
          <Typography style={typography.h2}>Heading 2 (Direct)</Typography>
          <Typography style={typography.body}>Body Text (Direct)</Typography>
          <Typography style={typography.caption}>Caption (Direct)</Typography>
        </View>

        {/* Font Family Usage */}
        <View className="bg-white p-4 rounded-xl">
          <Typography variant="h3" className="mb-4">Font Family Usage</Typography>
          <Typography style={{ fontFamily: fonts.regular, fontSize: 16 }}>
            Regular Font (16px)
          </Typography>
          <Typography style={{ fontFamily: fonts.medium, fontSize: 16 }}>
            Medium Font (16px)
          </Typography>
          <Typography style={{ fontFamily: fonts.bold, fontSize: 16 }}>
            Bold Font (16px)
          </Typography>
        </View>

        {/* Tailwind Classes */}
        <View className="bg-white p-4 rounded-xl">
          <Typography variant="h3" className="mb-4">Tailwind Classes</Typography>
          <Typography className="font-dm-regular text-base">Regular with Tailwind</Typography>
          <Typography className="font-dm-medium text-base">Medium with Tailwind</Typography>
          <Typography className="font-dm-bold text-base">Bold with Tailwind</Typography>
        </View>

        {/* Usage Instructions */}
        <View className="bg-blue-50 p-4 rounded-xl">
          <Typography variant="h4" className="mb-3">Usage Instructions</Typography>
          <Typography variant="bodySmall" className="mb-2">
            1. Use Typography component for consistent styling
          </Typography>
          <Typography variant="bodySmall" className="mb-2">
            2. Use direct styles for custom sizing
          </Typography>
          <Typography variant="bodySmall" className="mb-2">
            3. Use Tailwind classes for quick styling
          </Typography>
          <Typography variant="bodySmall" className="mb-2">
            4. Always wrap text in Text or Typography components
          </Typography>
        </View>

      </View>
    </ScrollView>
  );
}
