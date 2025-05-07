import React, { useState } from 'react';
import { StyleSheet, Platform, TouchableOpacity, Alert, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useTimer } from '../context/TimerContext';
import { Ionicons } from '@expo/vector-icons';

interface SessionTimerProps {
  variant?: 'main' | 'practice';
}

export function SessionTimer({ variant = 'practice' }: SessionTimerProps) {
  const { elapsedTime, totalTime, resetTotalTime } = useTimer();

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleResetPress = () => {
    Alert.alert(
      'Reset Timer',
      'Are you sure you want to reset the total time counter?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: resetTotalTime
        }
      ]
    );
  };

  return (
    <ThemedView style={[
      styles.container,
      variant === 'main' && styles.mainContainer,
      variant === 'practice' && styles.practiceContainer
    ]}>
      <View style={styles.timerContent}>
        <ThemedText style={styles.timerText}>
          {variant === 'main' 
            ? `Session: ${formatTime(elapsedTime)}` 
            : `Total: ${formatTime(totalTime)}`}
        </ThemedText>
        
        {variant === 'practice' && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetPress}
          >
            <Ionicons name="refresh" size={16} color="#ff4444" />
          </TouchableOpacity>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 12,
    zIndex: 999999,
    elevation: 999999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    width: 'auto',
  },
  mainContainer: {
    bottom: Platform.OS === 'ios' ? 106 : 86,
  },
  practiceContainer: {
    bottom: Platform.OS === 'ios' ? 106 : 86,
  },
  timerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  resetButton: {
    marginLeft: 8,
    padding: 4,
  },
}); 