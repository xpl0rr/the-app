import { StyleSheet, Image, Platform } from 'react-native';

// import { Collapsible } from '@/components/Collapsible';
// import { ExternalLink } from '@/components/ExternalLink';
// import ParallaxScrollView from '@/components/ParallaxScrollView';
// Using ThemedView as a temporary replacement for ParallaxScrollView
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
// import { IconSymbol } from '@/components/ui/IconSymbol';

export default function TabTwoScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Explore</ThemedText>
      </ThemedView>

      <ThemedText>This app includes example code to help you get started.</ThemedText>
      
      <ThemedText>
        This app has two screens:{' '}
        <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> and{' '}
        <ThemedText type="defaultSemiBold">app/(tabs)/explore.tsx</ThemedText>
      </ThemedText>
      <ThemedText>
        The layout file in <ThemedText type="defaultSemiBold">app/(tabs)/_layout.tsx</ThemedText>{' '}
        sets up the tab navigator.
      </ThemedText>
      {/* ExternalLink to Expo docs removed as component is missing */}

      <ThemedText>
        You can open this project on Android, iOS, and the web. To open the web version, press{' '}
        <ThemedText type="defaultSemiBold">w</ThemedText> in the terminal running this project.
      </ThemedText>

      <ThemedText>
        For static images, you can use the <ThemedText type="defaultSemiBold">@2x</ThemedText> and{' '}
        <ThemedText type="defaultSemiBold">@3x</ThemedText> suffixes to provide files for
        different screen densities
      </ThemedText>
      <Image source={require('@/assets/images/react-logo.png')} style={styles.image} />
      {/* ExternalLink to React Native docs removed */}

      <ThemedText>
        Open <ThemedText type="defaultSemiBold">app/_layout.tsx</ThemedText> to see how to load{' '}
        <ThemedText style={{ fontFamily: 'SpaceMono' }}>
          custom fonts such as this one.
        </ThemedText>
      </ThemedText>
      {/* ExternalLink to Expo fonts docs removed */}

      <ThemedText>
        This template has light and dark mode support. The{' '}
        <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText> hook lets you inspect
        what the user's current color scheme is, and so you can adjust UI colors accordingly.
      </ThemedText>
      {/* ExternalLink to Expo color themes docs removed */}

      <ThemedText>
        This template includes an example of an animated component. The{' '}
        <ThemedText type="defaultSemiBold">components/HelloWave.tsx</ThemedText> component uses
        the powerful <ThemedText type="defaultSemiBold">react-native-reanimated</ThemedText>{' '}
        library to create animations.
      </ThemedText>

      {Platform.select({
        ios: (
          <ThemedText>
            The <ThemedText type="defaultSemiBold">components/ParallaxScrollView.tsx</ThemedText>{' '}
            component provides a parallax effect for the header image. (This component is currently missing)
          </ThemedText>
        ),
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  image: {
    alignSelf: 'center',
    marginVertical: 16,
  },
});
