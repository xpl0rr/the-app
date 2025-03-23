import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useTimer } from '../context/TimerContext';

interface SessionTimerProps {
  variant?: 'main' | 'practice';
}

export function SessionTimer({ variant = 'practice' }: SessionTimerProps) {
  const { elapsedTime } = useTimer();

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <ThemedView style={[
      styles.container,
      variant === 'main' && styles.mainContainer,
      variant === 'practice' && styles.practiceContainer
    ]}>
      <ThemedText style={styles.timerText}>
        Session: {formatTime(elapsedTime)}
      </ThemedText>
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
    bottom: Platform.OS === 'ios' ? 65 : 45,
  },
  practiceContainer: {
    bottom: Platform.OS === 'ios' ? 100 : 80,
  },
  timerText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
}); 