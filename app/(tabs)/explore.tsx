import { StyleSheet, Image, Platform, ScrollView } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';

export default function ExploreScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">About Looper</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Welcome to Looper</ThemedText>
          <ThemedText>Looper is a video clip manager that helps you save, organize, and loop YouTube clips for practice and reference.</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Features</ThemedText>
          
          <ThemedText style={styles.feature}>• Save segments from YouTube videos</ThemedText>
          <ThemedText style={styles.feature}>• Set precise start and end points</ThemedText>
          <ThemedText style={styles.feature}>• Loop clips automatically</ThemedText>
          <ThemedText style={styles.feature}>• AirPlay support for iOS</ThemedText>
          <ThemedText style={styles.feature}>• Organize saved clips</ThemedText>
          <ThemedText style={styles.feature}>• Built-in practice timer</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>How to Use</ThemedText>
          
          <ThemedText style={styles.instructionTitle}>Finding Videos:</ThemedText>
          <ThemedText style={styles.instruction}>Search for YouTube videos in the Home tab.</ThemedText>
          
          <ThemedText style={styles.instructionTitle}>Creating Clips:</ThemedText>
          <ThemedText style={styles.instruction}>1. Play a video and tap the edit button</ThemedText>
          <ThemedText style={styles.instruction}>2. Set start and end points using the sliders</ThemedText>
          <ThemedText style={styles.instruction}>3. Use the preview button to test your clip</ThemedText>
          <ThemedText style={styles.instruction}>4. Save with a descriptive title</ThemedText>
          
          <ThemedText style={styles.instructionTitle}>Viewing Saved Clips:</ThemedText>
          <ThemedText style={styles.instruction}>Access all saved clips in the Saved Clips tab.</ThemedText>
          
          <ThemedText style={styles.instructionTitle}>Using AirPlay:</ThemedText>
          <ThemedText style={styles.instruction}>Tap the AirPlay button when watching a video and select your AirPlay device from Control Center.</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Version</ThemedText>
          <ThemedText>Looper v1.0.0</ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  feature: {
    marginBottom: 8,
    paddingLeft: 8,
  },
  instructionTitle: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 4,
  },
  instruction: {
    marginBottom: 4,
    paddingLeft: 8,
  },
});
