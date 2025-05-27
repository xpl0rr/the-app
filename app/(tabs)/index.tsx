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
  Linking,
  Alert,
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
      } else if (message.type === 'openInYouTube') {
        // Open the video in YouTube app or website
        const youtubeUrl = `https://www.youtube.com/watch?v=${message.videoId}`;
        Linking.openURL(youtubeUrl).catch((err: Error) => {
          console.error('Error opening YouTube link:', err);
          Alert.alert('Error', 'Could not open YouTube link');
        });
      } else if (message.type === 'error') {
        // Handle player errors
        console.log('Player error:', message.data);
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

  // Add a direct HTML iframe approach for more reliable YouTube embedding
  const getYouTubeIframeHTML = (videoId: string) => `
    <iframe 
      id="ytplayer" 
      width="100%" 
      height="100%" 
      src="https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&playsinline=1&controls=1&modestbranding=1" 
      frameborder="0" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
      allowfullscreen
    ></iframe>
  `;

  // YouTube HTML for WebView - Enhanced with direct API access
  const getYoutubeHTML = (videoId: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body { margin: 0; padding: 0; overflow: hidden; background-color: black; }
          #player { width: 100%; height: 100%; position: relative; }
          /* Play button overlay to ensure playing works */
          #playButton {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100px; /* Larger button */
            height: 100px; /* Larger button */
            background-color: rgba(0,0,0,0.7);
            border-radius: 50%;
            z-index: 999; /* Very high z-index to ensure it's on top */
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            border: 2px solid white;
          }
          #playButton.hidden { display: none; }
        </style>
      </head>
      <body>
        <div id="playerContainer" style="position: relative; width: 100%; height: 100%;">
          <div id="player"></div>
          <div id="playButton">▶</div>
        </div>
        <script>
          // Direct YouTube API implementation
          var tag = document.createElement('script');
          tag.src = "https://www.youtube.com/iframe_api";
          var firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

          var player;
          var playerReady = false;
          var playerLoaded = false;
          var currentTime = 0;
          
          // Manual controls - needed because of YouTube restrictions
          document.getElementById('playButton').addEventListener('click', function() {
            if (player && playerReady) {
              player.playVideo();
              this.classList.add('hidden');
            }
          });

          function onYouTubeIframeAPIReady() {
            player = new YT.Player('player', {
              height: '100%',
              width: '100%',
              videoId: '${videoId}',
              playerVars: {
                playsinline: 1,
                enablejsapi: 1,
                autoplay: 0,
                origin: window.location.origin,
                controls: 1,
                modestbranding: 1,
                rel: 0
              },
              events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
              }
            });
          }

          function onPlayerReady(event) {
            // Make player globally available
            window.player = player;
            playerReady = true;
            
            // Send duration to React Native
            try {
              var duration = player.getDuration() || 300;
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'playerReady',
                duration: duration
              }));
              playerLoaded = true;
            } catch(e) {
              console.log('Error getting duration:', e);
            }
            
            // Make the custom play button more visible
            document.getElementById('playButton').style.opacity = 1;
            
            // Setup direct command access for the player
            window.playVideo = function() {
              if (player && playerReady) {
                player.playVideo();
                document.getElementById('playButton').classList.add('hidden');
                return true;
              }
              return false;
            };
            
            window.pauseVideo = function() {
              if (player && playerReady) {
                player.pauseVideo();
                document.getElementById('playButton').classList.remove('hidden');
                return true;
              }
              return false;
            };
            
            window.seekTo = function(seconds) {
              if (player && playerReady) {
                player.seekTo(seconds, true);
                currentTime = seconds;
                return true;
              }
              return false;
            };
          }

          function onPlayerStateChange(event) {
            // Send player state to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'stateChange',
              data: event.data
            }));
            
            // Also send current time on state change
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'currentTime',
              value: player.getCurrentTime()
            }));
          }
          
          function onPlayerError(event) {
            // Handle player errors
            console.log('Player error:', event.data);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              code: event.data
            }));
          }
          
          // Send periodic time updates
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
            // Send player state changes to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'stateChange',
              data: event.data
            }));
            
            // Also send current time on state change
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'currentTime',
              value: player.getCurrentTime()
            }));
          }
          
          // Send periodic time updates
          setInterval(function() {
            if (player && player.getCurrentTime) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'currentTime',
                value: player.getCurrentTime()
              }));
            }
          }, 500);
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
          <SafeAreaView style={{ flex: 1, width: '100%' }}>
            {/* Video Player Section - Add top padding to ensure visibility */}
            <View style={[styles.videoWrapper, { paddingTop: 24 }]}>
              <WebView
                ref={webViewRef}
                source={{ html: getYoutubeHTML(currentVideo) }}
                style={[styles.webview, { height: 200 }]}
                onMessage={handleMessage}
                javaScriptEnabled={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                domStorageEnabled={true}
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
          </SafeAreaView>
        </View>
      )}
    </SafeAreaView>
  );
}