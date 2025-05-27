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
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'stateChange') {
        // Process player state changes
        console.log('Player state changed:', message.data);
      } else if (message.type === 'currentTime') {
        // Update current time for the editor
        const duration = message.value || 0;
        console.log('Current time update:', duration);
      }
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
          body { margin: 0; padding: 0; overflow: hidden; background-color: black; }
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
                origin: window.location.origin,
                controls: 0,
                showinfo: 0,
                rel: 0
              },
              events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
              }
            });
          }

          function onPlayerReady(event) {
            // Expose player to window for external control
            window.player = player;
            
            // Send ready event
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'playerReady',
              duration: player.getDuration()
            }));
            
            // Start periodic time updates
            setInterval(function() {
              if (player && player.getCurrentTime) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'currentTime',
                  value: player.getCurrentTime()
                }));
              }
            }, 500);
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
    centeredContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    headerContainer: {
      width: '100%',
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 20,
    },
    header: {
      fontSize: 24,
      textAlign: 'center',
      lineHeight: 32,
      color: '#000',
      marginBottom: 10,
      fontWeight: 'normal',
    },
    mainContent: {
      flex: 1,
      width: '100%',
      position: 'relative',
    },
    centeredSearchContainer: {
      width: '100%',
      position: 'absolute',
      top: '50%',
      left: 0,
      right: 0,
      transform: [{ translateY: -25 }], // Half of the search bar height
      zIndex: 1,
      paddingHorizontal: 16,
      display: 'flex',
    },
    topSearchContainer: {
      width: '100%',
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 10,
      marginBottom: 5,
    },
    searchWrapper: {
      width: '100%',
      alignItems: 'center',
      marginBottom: 20,
    },
    contentContainer: {
      width: '100%',
      alignItems: 'center',
      flex: 1,
      marginTop: 20,
      paddingBottom: 20,
    },
    videoContentContainer: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 24, // Status bar height + extra space
      paddingBottom: 0,
      backgroundColor: '#000',
      position: 'relative',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '90%',
      maxWidth: 500,
      backgroundColor: '#f0f0f0',
      borderRadius: 25,
      paddingHorizontal: 15,
      height: 50,
      marginLeft: 'auto',
      marginRight: 'auto',
      borderWidth: 1,
      borderColor: '#000',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    input: {
      flex: 1,
      height: 40,
      padding: 0,
      marginLeft: 10,
      fontSize: 16,
      color: '#000',
      includeFontPadding: false,
      borderWidth: 0,
      backgroundColor: 'transparent',
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
      height: 160, // Minimal height to fit at top
      backgroundColor: '#000',
    },
    videoWrapper: {
      width: '100%',
      height: 160, // Match webview height
      marginTop: 0,
      marginBottom: 0,
      paddingTop: 6, // Add padding above video
      backgroundColor: '#000',
      alignSelf: 'flex-start', // Pin to top
    },
    safeArea: {
      width: '100%',
      height: '100%',
      flexDirection: 'column',
      justifyContent: 'flex-start', // Align to top
      alignItems: 'center',
      marginTop: 8, // Add space at the top
    },
    editorWrapper: {
      width: '100%',
      height: 250, // Even larger area for editor
      backgroundColor: '#111',
      marginTop: 0,
      alignSelf: 'flex-start',
    },
  });

  // Styles for the search container
  const searchContainerStyle: ViewStyle = {
    ...styles.searchContainer,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  };
  
  const searchFieldStyle: ViewStyle = {
    ...styles.searchContainer,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
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
      {!currentVideo ? (
        // SEARCH VIEW - Show when no video is selected
        <>
          {/* Header with Title - Only show when not searching */}
          {videos.length === 0 && (
            <View style={styles.headerContainer}>
              <ThemedText style={styles.header}>
                Download And Loop
                <ThemedText style={styles.header}>
                  {'\n'}YouTube Videos
                </ThemedText>
              </ThemedText>
            </View>
          )}
          
          {/* Search Bar - Top position when searching, centered otherwise */}
          <View style={videos.length > 0 ? styles.topSearchContainer : styles.centeredSearchContainer}>
            <View style={styles.searchContainer}>
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
                  onPress={() => {
                    setSearchQuery('');
                    setVideos([]);
                  }} 
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Content Area for Search Results */}
          <View style={styles.contentContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : (
              <FlatList
                data={videos}
                keyExtractor={(item) => item.id.videoId}
                renderItem={renderVideoItem}
                style={styles.videoList}
              />
            )}
          </View>
          
          {/* Session Timer */}
          <SessionTimer variant="main" />
        </>
      ) : (
        // VIDEO VIEW - Show when a video is selected
        <View style={styles.videoContentContainer}>
          <View style={styles.safeArea}>
            {/* Video at top */}
            <View style={styles.videoWrapper}>
              <WebView
                source={{ html: getYoutubeHTML(currentVideo) }}
                style={styles.webview}
                onMessage={handleMessage}
                javaScriptEnabled
                domStorageEnabled
                allowsFullscreenVideo={false}
                scrollEnabled={false}
              />
            </View>
            
            {/* Editor below video */}
            <View style={styles.editorWrapper}>
              <VideoEditor
                videoId={currentVideo}
                title={currentVideoTitle || 'Untitled Video'}
                duration={300} // Default to 5 minutes until we get actual duration
                onSave={() => setCurrentVideo(null)}
                webViewRef={webViewRef}
              />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}