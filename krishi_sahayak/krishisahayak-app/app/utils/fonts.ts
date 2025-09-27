// Font configuration for DM Sans
export const fonts = {
  regular: 'DM-Regular',
  medium: 'DM-Medium',
  bold: 'DM-Bold',
} as const;

// Font weight mappings
export const fontWeights = {
  regular: '400',
  medium: '500',
  bold: '700',
} as const;

// Typography scale using DM Sans
export const typography = {
  // Headers
  h1: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 40,
  },
  h2: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 36,
  },
  h3: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 32,
  },
  h4: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 28,
  },
  h5: {
    fontFamily: fonts.medium,
    fontSize: 18,
    lineHeight: 24,
  },
  h6: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 22,
  },
  
  // Body text
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  bodyLarge: {
    fontFamily: fonts.regular,
    fontSize: 18,
    lineHeight: 26,
  },
  
  // Labels and captions
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  
  // Buttons
  button: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  buttonSmall: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  buttonLarge: {
    fontFamily: fonts.medium,
    fontSize: 18,
    lineHeight: 26,
  },
} as const;

// Helper function to get font style
export const getFontStyle = (variant: keyof typeof typography) => {
  return typography[variant];
};

// Helper function to create text style with DM Sans
export const createTextStyle = (fontWeight: keyof typeof fonts, fontSize: number, lineHeight?: number) => {
  return {
    fontFamily: fonts[fontWeight],
    fontSize,
    lineHeight: lineHeight || fontSize * 1.5,
  };
};