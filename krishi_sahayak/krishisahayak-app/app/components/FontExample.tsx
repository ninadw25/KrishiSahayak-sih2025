import { Text, View } from 'react-native';
import { fonts, typography } from '../utils/fonts';
import Typography from './Typography';

export default function FontExample() {
  return (
    <View className="p-4 space-y-4">
      {/* Using Tailwind classes */}
      <Text className="font-dm-regular text-lg">DM Regular with Tailwind</Text>
      <Text className="font-dm-medium text-lg">DM Medium with Tailwind</Text>
      <Text className="font-dm-bold text-lg">DM Bold with Tailwind</Text>
      
      {/* Using direct fontFamily prop */}
      <Text style={{ fontFamily: fonts.regular, fontSize: 18 }}>
        DM Regular with style prop
      </Text>
      <Text style={{ fontFamily: fonts.medium, fontSize: 18 }}>
        DM Medium with style prop
      </Text>
      <Text style={{ fontFamily: fonts.bold, fontSize: 18 }}>
        DM Bold with style prop
      </Text>
      
      {/* Using Typography component (Recommended) */}
      <Typography variant="h1">Heading 1</Typography>
      <Typography variant="h2">Heading 2</Typography>
      <Typography variant="h3">Heading 3</Typography>
      <Typography variant="body">Body text</Typography>
      <Typography variant="bodySmall">Small body text</Typography>
      <Typography variant="caption">Caption text</Typography>
      
      {/* Using typography scale directly */}
      <Text style={typography.h1}>Heading 1 (Direct)</Text>
      <Text style={typography.body}>Body text (Direct)</Text>
      <Text style={typography.caption}>Caption text (Direct)</Text>
    </View>
  );
}