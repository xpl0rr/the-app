import { StyleSheet } from 'react-native';
import { ThemedView } from '../components/ThemedView';
import { SessionTimer } from '../components/SessionTimer';
import { VideoStorage } from '../components/VideoStorage';

export default function SavedClipsScreen() {
  return (
    <ThemedView style={styles.container}>
      <VideoStorage />
      <SessionTimer variant="practice" />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
}); 