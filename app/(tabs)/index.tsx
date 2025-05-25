import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ViewStyle,
} from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { SessionTimer } from '../components/SessionTimer';
import { VideoEditor } from '../components/VideoEditor';
import WebView from 'react-native-webview';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

type VideoItem = {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: { default: { url: string } };
  };
};

const YT = {
  PlayerState: {
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
    CUED: 5,
  },
};

export default function HomeScreen() {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState('');
  const webViewRef = useRef<WebView>(null);
  const API_KEY = (Constants.expoConfig?.extra?.googleApiKey as string) || '';

  // Extract video ID from URL
  const extractVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Handle video selection
  const handleVideoSelect = (video: VideoItem) => {
    setCurrentVideo(video.id.videoId);
    setCurrentVideoTitle(video.snippet.title);
  };

  // Handle WebView messages
  const handleMessage = (event: any) => {
    try {
      const state = parseInt(event.nativeEvent.data);
      // Handle player state changes if needed
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    const videoId = extractVideoId(searchQuery);
    if (videoId) {
      setCurrentVideo(videoId);
      setCurrentVideoTitle('YouTube Video');
      setVideos([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          searchQuery
        )}&type=video&key=${API_KEY}`
      );
      const data = await response.json();
      setVideos(data.items || []);
    } catch (error) {
      console.error('Error searching YouTube:', error);
    } finally {
      setLoading(false);
    }
  };

  // YouTube HTML for WebView
  const getYoutubeHTML = (videoId: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body { margin: 0; padding: 0; overflow: hidden; }
          #player { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div id="player"></div>
        <script>
          var tag = document.createElement('script');
          tag.src = "https://www.youtube.com/iframe_api";
          var firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

          var player;
          function onYouTubeIframeAPIReady() {
            player = new YT.Player('player', {
              height: '100%',
              width: '100%',
              videoId: '${videoId}',
              playerVars: {
                playsinline: 1,
                enablejsapi: 1,
                origin: window.location.origin
              },
              events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
              }
            });
          }


          function onPlayerReady(event) {
            // Player is ready
          }

          function onPlayerStateChange(event) {
            // Send player state to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'stateChange',
              data: event.data
            }));
          }
        </script>
      </body>
    </html>
  `;

  // Styles
  const styles = StyleSheet.create({
    container: { 
      flex: 1,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 16,
    },
    headerContainer: {
      width: '100%',
      paddingTop: 10,
    },
    contentContainer: {
      width: '100%',
      alignItems: 'center',
      marginTop: 20,
      paddingBottom: 20,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f0f0f0',
      borderRadius: 25,
      padding: 10,
      width: '100%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      alignSelf: 'center',
      maxWidth: 500,
    },
    input: {
      flex: 1,
      height: 40,
      padding: 8,
      backgroundColor: '#fff',
      borderRadius: 5,
      marginLeft: 10,
      borderWidth: 1,
      borderColor: '#e0e0e0',
      fontSize: 16,
      color: '#000',
      includeFontPadding: false,
    },
    clearButton: {
      padding: 8,
    },
    videoItem: {
      flexDirection: 'row',
      padding: 12,
      marginBottom: 8,
      backgroundColor: '#f8f8f8',
      borderRadius: 8,
      width: '100%',
    },
    videoList: {
      width: '100%',
      paddingHorizontal: 8,
    },
    thumbnail: {
      width: 120,
      height: 68,
      borderRadius: 4,
      marginRight: 12,
    },
    videoInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    videoTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: '#000',
    },
    videoDescription: {
      fontSize: 12,
      color: '#666',
      marginTop: 4,
    },
    webview: {
      width: '100%',
      aspectRatio: 16/9,
      marginBottom: 16,
      backgroundColor: '#000',
    },
    header: {
      fontSize: 22,
      fontWeight: 'normal',
      marginBottom: 16,
      textAlign: 'center',
      color: '#000',
    },
    videoContentContainer: {
      marginTop: 0,
      paddingTop: 10,
    },
  });

  // Styles for the search container
  const searchContainerStyle: ViewStyle = {
    ...styles.searchContainer,
    position: 'absolute',
    top: '50%',
    left: 16,
    right: 16,
    transform: [{ translateY: -25 }], // Half of the container height
  };
  

  // Render video item for FlatList
  const renderVideoItem = ({ item }: { item: VideoItem }) => (
    <TouchableOpacity 
      style={styles.videoItem}
      onPress={() => handleVideoSelect(item)}
    >
      <Image 
        source={{ uri: item.snippet.thumbnails.default.url }} 
        style={styles.thumbnail} 
      />
      <View style={styles.videoInfo}>
        <ThemedText style={styles.videoTitle} numberOfLines={2}>
          {item.snippet.title}
        </ThemedText>
        <ThemedText style={styles.videoDescription} numberOfLines={2}>
          {item.snippet.description}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {!currentVideo && !loading && (
        <>
          <View style={styles.headerContainer}>
            <ThemedText style={styles.header}>
              Download And Loop
              <ThemedText style={styles.header}>
                {'\n'}YouTube Videos
              </ThemedText>
            </ThemedText>
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={searchContainerStyle}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Search YouTube"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                placeholderTextColor="#666"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setSearchQuery('')} 
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </>
      )}

      {/* Content Area */}
      <View style={[
        styles.contentContainer,
        currentVideo && styles.videoContentContainer
      ]}>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : currentVideo ? (
          <>
            <WebView
              source={{ html: getYoutubeHTML(currentVideo) }}
              style={styles.webview}
              onMessage={handleMessage}
              javaScriptEnabled
              domStorageEnabled
              allowsFullscreenVideo={false}
              scrollEnabled={false}
            />
            <VideoEditor
              videoId={currentVideo}
              title={currentVideoTitle || 'Untitled Video'}
              duration={0}
              onSave={() => setCurrentVideo(null)}
              webViewRef={webViewRef}
            />
          </>
        ) : (
          <>
            <FlatList
              data={videos}
              keyExtractor={(item) => item.id.videoId}
              renderItem={renderVideoItem}
              contentContainerStyle={styles.videoList}
            />
          </>
        )}
      </View>
      
      {/* Session Timer - Only show when no video is selected */}
      {!currentVideo && <SessionTimer variant="main" />}
    </SafeAreaView>
  );
}