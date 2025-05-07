import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { Ionicons } from '@expo/vector-icons';
import WebView from 'react-native-webview';
import { useIsFocused } from '@react-navigation/native';

interface SavedVideo {
  id: string;
  title: string;
  videoId: string;
  startTime?: number;
  endTime?: number;
  isClip: boolean;
  savedAt: number;
}

export function VideoStorage() {
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<SavedVideo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const loadSavedVideos = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedVideos');
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
      await AsyncStorage.setItem('savedVideos', JSON.stringify(updatedVideos));
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
    setSelectedVideo(video);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedVideo(null);
  };

  const getYoutubePlayerHTML = (video: SavedVideo) => {
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
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.sectionTitle}>Saved Clips</ThemedText>
      <ScrollView style={styles.scrollView}>
        {savedVideos.map(video => (
          <ThemedView key={video.id} style={styles.videoItem}>
            <TouchableOpacity 
              style={styles.videoInfo}
              onPress={() => playVideo(video)}
            >
              <ThemedText style={styles.videoTitle}>{video.title}</ThemedText>
              <ThemedText style={styles.videoDetails}>
                {video.isClip ? `Clip: ${formatTime(video.startTime || 0)} - ${formatTime(video.endTime || 0)}` : 'Full Video'}
              </ThemedText>
              <ThemedText style={styles.tapToPlay}>Tap to play</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => confirmDelete(video)}
            >
              <Ionicons name="trash-outline" size={24} color="#ff4444" />
            </TouchableOpacity>
          </ThemedView>
        ))}
        {savedVideos.length === 0 && (
          <ThemedText style={styles.emptyText}>
            No saved clips yet. Save videos from the main page to watch them later.
          </ThemedText>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>
              {selectedVideo?.title}
            </ThemedText>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </ThemedView>
          <ThemedView style={styles.playerContainer}>
            {selectedVideo && (
              <WebView
                ref={webViewRef}
                style={styles.webView}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                source={{ html: getYoutubePlayerHTML(selectedVideo) }}
              />
            )}
          </ThemedView>
        </ThemedView>
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
  container: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  videoItem: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  videoInfo: {
    flex: 1,
    padding: 8,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#fff',
  },
  videoDetails: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  tapToPlay: {
    fontSize: 12,
    color: '#00a86b',
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  playerContainer: {
    height: 240,
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  webView: {
    flex: 1,
  }
}); 