import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

interface TypographyProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'bodySmall' | 'bodyLarge' | 'caption' | 'label';
  children: React.ReactNode;
}

const typographyStyles = {
  h1: {
    fontFamily: 'DM-Bold',
    fontSize: 32,
    lineHeight: 40,
  },
  h2: {
    fontFamily: 'DM-Bold',
    fontSize: 28,
    lineHeight: 36,
  },
  h3: {
    fontFamily: 'DM-Bold',
    fontSize: 24,
    lineHeight: 32,
  },
  h4: {
    fontFamily: 'DM-Bold',
    fontSize: 20,
    lineHeight: 28,
  },
  h5: {
    fontFamily: 'DM-Medium',
    fontSize: 18,
    lineHeight: 24,
  },
  h6: {
    fontFamily: 'DM-Medium',
    fontSize: 16,
    lineHeight: 22,
  },
  body: {
    fontFamily: 'DM-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: 'DM-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  bodyLarge: {
    fontFamily: 'DM-Regular',
    fontSize: 18,
    lineHeight: 26,
  },
  label: {
    fontFamily: 'DM-Medium',
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: 'DM-Regular',
    fontSize: 12,
    lineHeight: 16,
  },
};

export default function Typography({ 
  variant = 'body', 
  style, 
  children, 
  ...props 
}: TypographyProps) {
  const variantStyle = typographyStyles[variant];

  return (
    <RNText 
      style={[variantStyle, style]} 
      {...props}
    >
      {children}
    </RNText>
  );
}
