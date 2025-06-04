import React from 'react';
import { StyleSheet, ScrollView, Alert, Switch, View, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { useColorScheme } from '../../hooks/useColorScheme';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const [autoLoop, setAutoLoop] = React.useState(true);
  const [showTimer, setShowTimer] = React.useState(true);
  
  // Load settings on mount
  React.useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('looperSettings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        setAutoLoop(parsedSettings.autoLoop ?? true);
        setShowTimer(parsedSettings.showTimer ?? true);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };
  
  const saveSettings = async (key: string, value: boolean) => {
    try {
      // Get current settings
      const settings = await AsyncStorage.getItem('looperSettings') || '{}';
      const parsedSettings = JSON.parse(settings);
      
      // Update with new value
      const updatedSettings = {
        ...parsedSettings,
        [key]: value
      };
      
      // Save updated settings
      await AsyncStorage.setItem('looperSettings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Could not save settings');
    }
  };
  
  const handleAutoLoopChange = (value: boolean) => {
    setAutoLoop(value);
    saveSettings('autoLoop', value);
  };
  
  const handleShowTimerChange = (value: boolean) => {
    setShowTimer(value);
    saveSettings('showTimer', value);
  };
  
  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your saved clips and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All Data', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'All data cleared successfully');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Could not clear data');
            }
          }
        }
      ]
    );
  };
  
  return (
    <ErrorBoundary>
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="title" style={styles.titleText}>Settings</ThemedText>
          
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Playback Options</ThemedText>
            
            <View style={styles.settingRow}>
              <ThemedText style={styles.settingLabel}>Auto-Loop Clips</ThemedText>
              <Switch
                value={autoLoop}
                onValueChange={handleAutoLoopChange}
                trackColor={{ false: '#767577', true: '#2176FF' }}
                thumbColor="#f4f3f4"
              />
            </View>
            
            <View style={styles.settingRow}>
              <ThemedText style={styles.settingLabel}>Show Practice Timer</ThemedText>
              <Switch
                value={showTimer}
                onValueChange={handleShowTimerChange}
                trackColor={{ false: '#767577', true: '#2176FF' }}
                thumbColor="#f4f3f4"
              />
            </View>
          </View>
          
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Data Management</ThemedText>
            
            <TouchableOpacity 
              style={styles.button}
              onPress={clearAllData}
            >
              <ThemedText style={styles.buttonText}>Clear All Data</ThemedText>
            </TouchableOpacity>
          </View>
          
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>About</ThemedText>
            
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Version</ThemedText>
              <ThemedText style={styles.infoValue}>
                {Constants.expoConfig?.version || '1.0.0'}
              </ThemedText>
            </View>
            
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Build</ThemedText>
              <ThemedText style={styles.infoValue}>
                {Constants.expoConfig?.ios?.buildNumber || 'development'}
              </ThemedText>
            </View>
            
            <ThemedText style={[styles.infoValue, styles.copyright]}>
              © {new Date().getFullYear()} Looper
            </ThemedText>
          </View>
        </ScrollView>
      </ThemedView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 40,
  },
  titleText: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(80, 80, 80, 0.3)',
  },
  settingLabel: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#d32f2f',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    opacity: 0.7,
  },
  infoValue: {
    fontWeight: '500',
  },
  copyright: {
    marginTop: 12,
    textAlign: 'center',
    opacity: 0.5,
  },
});
