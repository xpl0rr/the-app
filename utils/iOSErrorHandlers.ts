import { Alert, Platform } from 'react-native';

/**
 * iOS-specific error handlers to improve app stability
 */

/**
 * Global error catcher for unhandled JS errors
 */
export const setupGlobalErrorHandler = () => {
  if (Platform.OS === 'ios') {
    // Only set up for iOS as per app requirements
    const originalHandler = ErrorUtils.getGlobalHandler();
    
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      // Log the error first
      console.error('Uncaught error:', error);
      
      // Show a user-friendly message for fatal errors
      if (isFatal) {
        Alert.alert(
          'Unexpected Error',
          'Something went wrong. Please restart the app.',
          [{ text: 'OK' }]
        );
      }
      
      // Call the original handler
      originalHandler(error, isFatal);
    });
  }
};

/**
 * Handle iOS memory warnings
 * @param callback Optional callback to run on memory warning
 */
export const setupMemoryWarningHandler = (callback?: () => void) => {
  if (Platform.OS === 'ios') {
    // This would use a native module in a real implementation
    // For now, this is just a placeholder for where you'd listen to memory warnings
    console.log('iOS memory warning handler would be set up here');
    
    // In a real app, you would:
    // 1. Listen to AppState changes
    // 2. Clear caches when app goes to background
    // 3. Implement proper memory cleanup
  }
};

/**
 * Check if the device is in low power mode
 * Important for optimizing video playback on iOS
 */
export const checkLowPowerMode = async (): Promise<boolean> => {
  // This would use a native module in a real implementation
  // For demonstration purposes, we'll return false
  return false;
};

/**
 * Check for minimum iOS version requirements
 * @param minVersion Minimum iOS version required
 */
export const checkiOSVersion = (minVersion: string): boolean => {
  if (Platform.OS !== 'ios') return true;
  
  const currentVersion = Platform.Version;
  
  // Compare versions (simple implementation)
  const currentParts = String(currentVersion).split('.').map(Number);
  const minParts = minVersion.split('.').map(Number);
  
  for (let i = 0; i < Math.max(currentParts.length, minParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const minPart = minParts[i] || 0;
    
    if (currentPart > minPart) return true;
    if (currentPart < minPart) return false;
  }
  
  return true; // Versions are equal
};

/**
 * Optimize video playback for iOS device capabilities
 * @param isLowPowerMode Whether device is in low power mode
 */
export const getOptimizedVideoQuality = (isLowPowerMode: boolean): 'high' | 'medium' | 'low' => {
  if (isLowPowerMode) {
    return 'low';
  }
  
  // You could expand this to check for device model, available memory, etc.
  return 'high';
};
