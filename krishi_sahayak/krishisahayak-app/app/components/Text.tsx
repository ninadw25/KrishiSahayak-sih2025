import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

interface TextProps extends RNTextProps {
  variant?: 'regular' | 'medium' | 'bold';
  children: React.ReactNode;
}

export default function Text({ 
  variant = 'regular', 
  style, 
  children, 
  ...props 
}: TextProps) {
  const fontFamily = {
    regular: 'DM-Regular',
    medium: 'DM-Medium',
    bold: 'DM-Bold',
  }[variant];

  return (
    <RNText 
      style={[{ fontFamily }, style]} 
      {...props}
    >
      {children}
    </RNText>
  );
}