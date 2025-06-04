import React, { memo } from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';

interface VideoItemProps {
  title: string;
  thumbnailUrl?: string;
  duration?: string;
  onPress: () => void;
}

/**
 * Memoized video item component to improve list performance
 * Only re-renders when props change
 */
const VideoItem = memo(function VideoItem({ 
  title, 
  thumbnailUrl, 
  duration,
  onPress 
}: VideoItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.thumbnailContainer}>
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <ThemedText>No Thumbnail</ThemedText>
          </View>
        )}
        {duration && (
          <View style={styles.durationBadge}>
            <ThemedText style={styles.durationText}>{duration}</ThemedText>
          </View>
        )}
      </View>
      <View style={styles.textContainer}>
        <ThemedText numberOfLines={2} style={styles.title}>
          {title}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
  },
  thumbnailContainer: {
    position: 'relative',
    width: 120,
    height: 68,
    marginRight: 12,
    borderRadius: 4,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  durationText: {
    fontSize: 12,
    color: 'white',
  },
});

export default VideoItem;
