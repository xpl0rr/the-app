import { StyleSheet } from 'react-native';
import { ThemedView } from '../components/ThemedView';
import { SessionTimer } from '../components/SessionTimer';

export default function PracticeSummaryScreen() {
  return (
    <ThemedView style={styles.container}>
      <SessionTimer />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
}); 