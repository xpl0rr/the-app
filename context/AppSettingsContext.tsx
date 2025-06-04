import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AppSettings = {
  autoLoop: boolean;
  showTimer: boolean;
  theme: 'light' | 'dark' | 'system';
};

type AppSettingsContextType = {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  isLoading: boolean;
};

const defaultSettings: AppSettings = {
  autoLoop: true,
  showTimer: true,
  theme: 'system',
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem('looperSettings');
      if (storedSettings) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...JSON.parse(storedSettings)
        }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await AsyncStorage.setItem('looperSettings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  return (
    <AppSettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
}
