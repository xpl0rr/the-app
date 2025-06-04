import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '../../components/ThemedView';
import { SessionTimer } from '../../components/SessionTimer';
import { VideoStorage } from '../../components/VideoStorage';

export default function SavedClipsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.storageContainer}>
          <VideoStorage />
        </ThemedView>
        <ThemedView style={styles.timerContainer}>
          <SessionTimer variant="practice" />
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  storageContainer: {
    flex: 1,
    paddingBottom: 65, // Make room for the timer at the bottom
  },
  timerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(40, 40, 40, 0.9)', // Semi-transparent background
    zIndex: 10,
    paddingBottom: 32, // Add padding for bottom safe area
    paddingTop: 4,
  },
});
