import { View, ViewProps } from 'react-native';
import React from 'react';

export function ThemedView({ style, ...props }: ViewProps) {
  return <View style={[{ backgroundColor: '#1a1a1a' }, style]} {...props} />;
} 