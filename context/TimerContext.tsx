import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TimerContextType {
  elapsedTime: number;
  totalTime: number;
  setElapsedTime: (time: number) => void;
  resetTotalTime: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const TOTAL_TIME_KEY = 'total_app_time';

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [lastSaveTime, setLastSaveTime] = useState(0);

  // Load total time from storage on component mount
  useEffect(() => {
    const loadTotalTime = async () => {
      try {
        const storedTime = await AsyncStorage.getItem(TOTAL_TIME_KEY);
        if (storedTime) {
          setTotalTime(parseInt(storedTime, 10) || 0);
        }
      } catch (error) {
        console.error('Error loading total time:', error);
      }
    };
    
    loadTotalTime();
  }, []);

  // Increment session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
      
      // Update total time as well
      setTotalTime(prev => prev + 1);
      
      // Mark for periodic saving
      setLastSaveTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Save total time to AsyncStorage every minute
  useEffect(() => {
    // Only save every 60 seconds to reduce storage operations
    if (lastSaveTime % 60 === 0 && lastSaveTime > 0) {
      const saveTime = async () => {
        try {
          await AsyncStorage.setItem(TOTAL_TIME_KEY, totalTime.toString());
        } catch (error) {
          console.error('Error saving total time:', error);
        }
      };
      
      saveTime();
    }
  }, [lastSaveTime, totalTime]);

  // Save when the app is closed/backgrounded
  useEffect(() => {
    const handleAppStateChange = async () => {
      try {
        await AsyncStorage.setItem(TOTAL_TIME_KEY, totalTime.toString());
      } catch (error) {
        console.error('Error saving total time on app state change:', error);
      }
    };

    // Handle app closure
    return () => {
      handleAppStateChange();
    };
  }, [totalTime]);

  // Function to reset the total time
  const resetTotalTime = async () => {
    try {
      await AsyncStorage.setItem(TOTAL_TIME_KEY, '0');
      setTotalTime(0);
    } catch (error) {
      console.error('Error resetting total time:', error);
    }
  };

  return (
    <TimerContext.Provider value={{ elapsedTime, totalTime, setElapsedTime, resetTotalTime }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
} 