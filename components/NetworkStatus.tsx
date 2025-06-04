import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { ThemedText } from './ThemedText';

interface NetworkStatusProps {
  showOnlyOffline?: boolean;
}

export function NetworkStatus({ showOnlyOffline = true }: NetworkStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    // Subscribe to network status updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    // Initial check
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
    });

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, []);

  // Don't show anything when connected and showOnlyOffline is true
  if (isConnected && showOnlyOffline) {
    return null;
  }

  return (
    <View style={[styles.container, !isConnected ? styles.offline : styles.online]}>
      <ThemedText style={styles.text}>
        {isConnected ? 'Back Online' : 'No Internet Connection'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  offline: {
    backgroundColor: '#B71C1C',
  },
  online: {
    backgroundColor: '#2E7D32',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
