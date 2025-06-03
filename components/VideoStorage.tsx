import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, View, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation, NavigationProp } from '@react-navigation/native';

interface SavedVideo {
  id: string;
  title: string;
  videoId: string;
  startTime?: number;
  endTime?: number;
  isClip: boolean;
  savedAt: number;
}

// Define a type for the navigation parameters expected by the 'index' route
type RootStackParamList = {
  index: {
    videoId: string;
    title: string;
    startTime?: number;
    endTime?: number;
    thumbnailUrl?: string; // Added for clip navigation
    description?: string; // Added for clip navigation
  };
  // Add other routes here if your app has more screens in this navigator
};

export function VideoStorage() {
  // Temporary button for clearing storage - REMOVE FOR PRODUCTION
  const renderClearButton = () => (
    <TouchableOpacity onPress={clearAllClips} style={styles.clearButton}>
      <ThemedText style={styles.clearButtonText}>Clear All Saved Clips (Debug)</ThemedText>
    </TouchableOpacity>
  );

  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Rename dialog state
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);

  const clearAllClips = async () => {
    try {
      await AsyncStorage.removeItem('savedClips');
      setSavedVideos([]);
      Alert.alert('Storage Cleared', 'All saved clips have been removed.');
    } catch (error) {
      console.error('Error clearing saved clips:', error);
      Alert.alert('Error', 'Could not clear saved clips.');
    }
  };

  const loadSavedVideos = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedClips');
      if (saved) {
        setSavedVideos(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved videos:', error);
    }
  };

  // Reload saved videos when screen is focused
  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused) {
      loadSavedVideos();
    }
  }, [isFocused]);

  const deleteVideo = async (id: string) => {
    try {
      const updatedVideos = savedVideos.filter(video => video.id !== id);
      await AsyncStorage.setItem('savedClips', JSON.stringify(updatedVideos));
      setSavedVideos(updatedVideos);
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  const confirmDelete = (video: SavedVideo) => {
    Alert.alert(
      'Delete Video',
      `Are you sure you want to delete "${video.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteVideo(video.id) }
      ]
    );
  };

  const playVideo = (video: SavedVideo) => {
    // Add placeholder values for thumbnailUrl and description
    navigation.navigate('index', {
      videoId: video.videoId,
      title: video.title,
      startTime: video.startTime,
      endTime: video.endTime,
      thumbnailUrl: 'https://i.ytimg.com/vi/' + video.videoId + '/default.jpg', // YouTube thumbnail URL format
      description: video.title, // Use title as description since we don't store descriptions
    });
  };

  /* const getYoutubePlayerHTML = (video: SavedVideo) => { // This function is no longer needed
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://www.youtube.com/iframe_api"></script>
        <style>
          body { margin: 0; background: #000; }
          .video-container { position: relative; width: 100%; height: 100%; }
          iframe { width: 100%; height: 100%; border: none; }
        </style>
      </head>
      <body>
        <div id="player" class="video-container"></div>
        <script>
          let startTime = ${video.startTime || 0};
          let endTime = ${video.endTime || 0};
          let isClip = ${video.isClip};
          let checkInterval;

          function onYouTubeIframeAPIReady() {
            window.player = new YT.Player('player', {
              videoId: '${video.videoId}',
              playerVars: {
                'rel': 0,
                'showinfo': 0,
                'modestbranding': 1,
                'controls': 1,
                'autoplay': 1,
                'start': ${Math.round(video.startTime || 0)},
                'loop': 0,
                'playlist': '${video.videoId}'
              },
              events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
              }
            });
          }

          function onPlayerReady(event) {
            event.target.playVideo();
            if (isClip) {
              event.target.seekTo(startTime);
              
              // Set up interval to monitor playback time and reset when needed
              checkInterval = setInterval(checkTime, 500);
            }
          }

          function checkTime() {
            if (!window.player || typeof window.player.getCurrentTime !== 'function') return;
            
            let currentTime = window.player.getCurrentTime();
            if (isClip && currentTime >= endTime - 0.5) {
              window.player.seekTo(startTime);
              window.player.playVideo();
            }
          }

          function onPlayerStateChange(event) {
            // If the video ends, we want to handle it for clips
            if (event.data === YT.PlayerState.ENDED) {
              if (isClip) {
                window.player.seekTo(startTime);
                window.player.playVideo();
              }
            }
            
            // If the user pauses the video, we should pause our checking
            if (event.data === YT.PlayerState.PAUSED) {
              if (checkInterval) {
                clearInterval(checkInterval);
                checkInterval = null;
              }
            }
            
            // If the user starts playing again, resume checking
            if (event.data === YT.PlayerState.PLAYING) {
              if (!checkInterval && isClip) {
                checkInterval = setInterval(checkTime, 500);
              }
            }
          }
        </script>
      </body>
    </html>
    `;
  }; */ // End of commented out getYoutubePlayerHTML

  const handleRenamePress = (video: SavedVideo) => {
    setRenameValue(video.title);
    setRenameTargetId(video.id);
    setRenameModalVisible(true);
  };

  const handleCancelRename = () => {
    setRenameModalVisible(false);
    setRenameValue('');
    setRenameTargetId(null);
  };

  const handleSaveRename = async () => {
    if (!renameTargetId) return;
    try {
      const updated = savedVideos.map(v => v.id === renameTargetId ? { ...v, title: renameValue } : v);
      await AsyncStorage.setItem('savedClips', JSON.stringify(updated));
      setSavedVideos(updated);
    } catch (error) {
      console.error('Error renaming video:', error);
    } finally {
      setRenameModalVisible(false);
    }
  };

  return (
    // Add the clear button at the top of the ScrollView or ThemedView
    // For example, inside ThemedView but before ScrollView:
    // <ThemedView style={styles.container}>
    //   {renderClearButton()}
    //   <ScrollView> ... </ScrollView>
    // </ThemedView>
    // Or, if you want it to scroll with content, place it inside ScrollView:
    // <ScrollView>
    //   {renderClearButton()}
    //   {savedVideos.map(...)}
    // </ScrollView>
    // Let's place it inside ThemedView, above the ScrollView for now.

    <ThemedView style={styles.container}>
      {renderClearButton()}
      <ThemedText style={styles.sectionTitle}>Saved Clips</ThemedText>
      <ScrollView style={styles.scrollView}>
        {savedVideos.map(video => (
          <ThemedView key={video.id} style={styles.videoItem}>
            <TouchableOpacity 
              style={styles.videoInfo}
              onPress={() => playVideo(video)}
            >
              <ThemedText style={styles.videoTitle}>
                {typeof video.title === 'string' ? video.title : '[Untitled Video]'}
              </ThemedText>
              <ThemedText style={styles.videoDetails}>
                {video.isClip ? `Clip: ${formatTime(video.startTime || 0)} - ${formatTime(video.endTime || 0)}` : 'Full Video'}
              </ThemedText>
              <ThemedText style={styles.tapToPlay}>Tap to play</ThemedText>
            </TouchableOpacity>
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => handleRenamePress(video)} style={styles.renameButton}>
                <Ionicons name="pencil" size={20} color="#666666" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => confirmDelete(video)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={20} color="#ff4444" />
              </TouchableOpacity>
            </View>
          </ThemedView>
        ))}
        {savedVideos.length === 0 && (
          <ThemedText style={styles.emptyText}>
            No saved clips yet. Save videos from the main page to watch them later.
          </ThemedText>
        )}
      </ScrollView>

      {/* Playback Modal removed, playback now handled by HomeScreen via navigation */}

      {/* Rename Video Modal */}
      <Modal
        visible={renameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelRename}
      >
        <View style={styles.renameModalContainer}>
          <View style={styles.renameModalContent}>
            <ThemedText style={styles.renameModalTitle}>Rename Video</ThemedText>
            <TextInput
              style={styles.renameInput}
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="Enter new title"
              placeholderTextColor="#999999"
              autoFocus={true}
            />
            <View style={styles.renameButtons}>
              <TouchableOpacity 
                onPress={handleCancelRename}
                style={[styles.confirmRenameButton, {backgroundColor: '#F0F0F0', marginRight: 12}]}
              >
                <ThemedText style={{color: '#333333'}}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSaveRename}
                style={styles.confirmRenameButton}
              >
                <ThemedText style={styles.renameButtonText}>Save Changes</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  clearButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'normal',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 24,
    color: '#000000',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 8,
  },
  videoItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  videoInfo: {
    flex: 1,
    paddingRight: 8,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: '#000000',
  },
  videoDetails: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  tapToPlay: {
    fontSize: 12,
    color: '#4D82F3',
    fontWeight: '500',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  renameButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 16,
    marginTop: 24,
    paddingHorizontal: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    paddingRight: 8,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  closeButtonText: {
    color: '#666666',
    fontSize: 14,
    marginLeft: 4,
  },
  playerContainer: {
    height: 240,
    backgroundColor: '#000000',
  },
  webView: {
    flex: 1,
  },
  renameModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 24,
  },
  renameModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  renameModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000000',
  },
  renameInput: {
    width: '100%',
    height: 48,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  confirmRenameButton: {
    backgroundColor: '#4D82F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  renameButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  renameButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: 8,
  },
}); 