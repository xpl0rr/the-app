import { Text, TextProps } from 'react-native';
import React from 'react';

interface ThemedTextProps extends TextProps {
  type?: 'default' | 'defaultSemiBold' | 'title';
}

export function ThemedText({ style, type = 'default', ...props }: ThemedTextProps) {
  const getTextStyle = () => {
    switch (type) {
      case 'defaultSemiBold':
        return { color: '#fff', fontWeight: '600' };
      case 'title':
        return { color: '#fff', fontSize: 20, fontWeight: 'bold' };
      default:
        return { color: '#fff' };
    }
  };

  return <Text style={[getTextStyle(), style]} {...props} />;
} 