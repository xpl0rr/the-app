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
import { ThemedText } from '../../components/ThemedText';
import { SessionTimer } from '../../components/SessionTimer';
import { VideoEditor } from '../../components/VideoEditor';
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
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0);
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
      console.log('WebView Message:', message); // Log the raw message

      if (message.type === 'playerReady') {
        console.log('Player is ready, waiting for full details.');
      } else if (message.type === 'playerFullyReady') {
        console.log('Player is fully ready with details:', message);
        if (message.duration !== null && typeof message.duration === 'number') {
          setVideoDuration(message.duration);
        }
        setCurrentVideoTime(0); 
      } else if (message.type === 'currentTime') { // This is the correct place for currentTime
        if (message.value !== null && typeof message.value === 'number') {
          setCurrentVideoTime(message.value);
          console.log('Current time updated from WebView:', message.value); // Specific log
        }
      } else if (message.type === 'clipEnded') {
        console.log('Clip ended message received in HomeScreen');
      } else if (message.type === 'playerStateChange') {
        console.log('Player state changed:', message.data);
      } else if (message.type === 'openInYouTube') {
        const youtubeUrl = `https://www.youtube.com/watch?v=${message.videoId}`;
        Linking.openURL(youtubeUrl).catch(err => console.error('Failed to open YouTube URL:', err));
      } else if (message.type === 'playerError') {
        console.error('Player Error:', message.data);
        Alert.alert('Player Error', `Error code: ${message.data.errorCode}`);
      } else if (message.type === 'log') { // For general logs from WebView
        console.log('WebView Log:', message.message);
      }
      // Add other message types as needed
    } catch (error) {
      console.error('Error handling WebView message:', error);
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
    ></iframe>
  `;

  // YouTube HTML for WebView - Enhanced with direct API access
  const getYoutubeHTML = (videoId: string) => `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body { margin: 0; padding: 0; overflow: hidden; background-color: black; }
          #player-container { width: 100vw; height: 100vh; }
        </style>
      </head>
      <body>
        <div id="player-container">
          <!-- Player will be inserted here by JavaScript -->
        </div>
        <script>
          var player;
          var isPlayerReady = false;
          const videoId = '${videoId}'; // Ensure videoId is correctly interpolated

          // Load the IFrame Player API code asynchronously.
          var tag = document.createElement('script');
          tag.src = "https://www.youtube.com/iframe_api";
          var firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

          // This function creates an <iframe> (and YouTube player)
          // after the API code downloads.
          function onYouTubeIframeAPIReady() {
            console.log('YouTube API Ready for video ID: ' + videoId);
            try {
              player = new YT.Player('player-container', { // Target the div
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                  'playsinline': 1,
                  'controls': 1, // Show native controls
                  'modestbranding': 1,
                  'rel': 0,
                  'showinfo': 0,
                  'fs': 0, // Disable fullscreen button if not needed
                  'iv_load_policy': 3
                },
                events: {
                  'onReady': onPlayerReady,
                  'onStateChange': onPlayerStateChange,
                  'onError': onPlayerError
                }
              });
            } catch (e) {
              console.error('Error creating YT.Player:', e);
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'playerCreationError', error: e.toString() }));
            }
          }

          // The API will call this function when the video player is ready.
          function onPlayerReady(event) {
            console.log('Player ready for video ID: ' + videoId);
            isPlayerReady = true;
            window.player = event.target; // Expose player instance globally

            try {
              var duration = player.getDuration() || 0;
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'playerFullyReady',
                videoId: videoId,
                duration: duration
              }));
            } catch (e) {
              console.error('Error in onPlayerReady (getDuration):', e);
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'playerReadyError', error: e.toString() }));
            }

            // Define global functions for React Native to call
            window.playVideo = function() {
              if (isPlayerReady && window.player && typeof window.player.playVideo === 'function') {
                window.player.playVideo();
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'playVideoCalled', success: true }));
                return true;
              } else {
                console.warn('playVideo: Player not ready or function unavailable.');
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'playVideoCalled', success: false, error: 'Player not ready or playVideo unavailable' }));
                return false;
              }
            };

            window.pauseVideo = function() {
              if (isPlayerReady && window.player && typeof window.player.pauseVideo === 'function') {
                window.player.pauseVideo();
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pauseVideoCalled', success: true }));
                return true;
              } else {
                console.warn('pauseVideo: Player not ready or function unavailable.');
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pauseVideoCalled', success: false, error: 'Player not ready or pauseVideo unavailable' }));
                return false;
              }
            };

            window.seekTo = function(seconds, allowSeekAhead) {
              if (isPlayerReady && window.player && typeof window.player.seekTo === 'function') {
                window.player.seekTo(seconds, allowSeekAhead);
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'seekToCalled', seconds: seconds, success: true }));
                return true;
              } else {
                console.warn('seekTo: Player not ready or function unavailable.');
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'seekToCalled', seconds: seconds, success: false, error: 'Player not ready or seekTo unavailable' }));
                return false;
              }
            };

            window.getCurrentTime = function() {
              if (isPlayerReady && window.player && typeof window.player.getCurrentTime === 'function') {
                var currentTimeValue = window.player.getCurrentTime();
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'currentTime', value: currentTimeValue }));
              } else {
                console.warn('getCurrentTime: Player not ready or function unavailable.');
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'currentTime', value: null, error: 'Player not ready or getCurrentTime unavailable' }));
              }
            };
          }

          // The API calls this function when the player's state changes.
          function onPlayerStateChange(event) {
            var currentTime = (isPlayerReady && player && typeof player.getCurrentTime === 'function') ? player.getCurrentTime() : 0;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'playerStateChange',
              state: event.data,
              currentTime: currentTime,
              videoId: videoId
            }));
          }

          // The API calls this function when the player encounters an error.
          function onPlayerError(event) {
            console.error('YouTube Player Error:', event.data);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'playerError',
              errorCode: event.data,
              videoId: videoId
            }));
          }

          console.log('Initial script loaded for video ID: ' + videoId);
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
      height: 240, // Increased height for better visibility
      backgroundColor: '#000',
      overflow: 'hidden',
    },
    videoWrapper: {
      width: '100%',
      height: 260, // Slightly more than webview to account for controls
      marginTop: 0,
      marginBottom: 10,
      paddingTop: 10, // Add padding above video
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

  const onShouldStartLoadWithRequest = (request: any /* WebViewNavigation */) => {
    const { url } = request;
    console.log('WebView attempting to load URL:', url);

    // Allow our initial HTML load (data URI or about:blank)
    if (url.startsWith('data:text/html') || url === 'about:blank') {
      console.log('Allowing initial HTML load');
      return true;
    }

    // Allow navigations necessary for the YouTube IFrame Player API
    const allowedEmbedDomains = [
      'https://www.youtube.com/embed/',
      'https://www.youtube-nocookie.com/embed/',
      'https://www.youtube.com/iframe_api', // The API script itself
      'https://www.youtube.com/', // Allow the base YouTube domain for API context
      'https://s.ytimg.com/', // Static assets for the player
      'https://googleads.g.doubleclick.net/', // Ads, often part of YouTube
      'https://static.doubleclick.net/'
      // Add other domains if legitimate player resources are blocked
    ];

    if (allowedEmbedDomains.some(domain => url.startsWith(domain))) {
      console.log('Allowing YouTube API/embed related URL:', url);
      return true;
    }

    // Specifically block navigation to full YouTube watch pages or mobile site
    if (url.includes('youtube.com/watch') || url.startsWith('https://m.youtube.com') || url.includes('youtu.be/')) {
      console.log('DENYING navigation to YouTube watch/mobile page:', url);
      return false;
    }
    
    console.log('WebView onShouldStartLoadWithRequest: Review and decide for URL:', url, '-> Defaulting to DENY.');
    // Default to false for unhandled cases to be safer.
    // If the player breaks, check console logs for URLs being denied that might be essential.
    return false;
  };

  // Simplified return with cleaner structure
  if (currentVideo) {
    // VIDEO VIEW - Show when a video is selected
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.videoContentContainer}>
          <SafeAreaView style={{ flex: 1, width: '100%' }}>
            {/* Video Player Section - Add top padding to ensure visibility */}
            <View style={[styles.videoWrapper, { paddingTop: 24 }]}>
              <WebView
                ref={webViewRef}
                source={{ html: getYoutubeHTML(currentVideo), baseUrl: 'https://www.youtube.com' }}
                style={[styles.webview, { height: 240 }]} /* Increased height for better visibility */
                onMessage={handleMessage}
                javaScriptEnabled={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                domStorageEnabled={true}
                scrollEnabled={false}
                bounces={false}
                /* Ensure the WebView responds to all events */
                allowsFullscreenVideo={false}
                onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
              />
            </View>
            
            {/* Editor below video */}
            <View style={styles.editorWrapper}>
              <VideoEditor
                videoId={currentVideo}
                title={currentVideoTitle || 'Untitled Video'}
                duration={videoDuration} // Pass actual duration
                currentTime={currentVideoTime} // Pass current time
                onSave={() => setCurrentVideo(null)}
                webViewRef={webViewRef}
              />
            </View>
          </SafeAreaView>
        </View>
      </SafeAreaView>
    );
  }
  
  // SEARCH VIEW - Show when no video is selected
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Title - Only show when not searching */}
      {videos.length === 0 && (
        <View style={styles.headerContainer}>
          <ThemedText style={styles.header}>
            Download And Loop
            <ThemedText style={styles.header}>
              {"\n"}YouTube Videos
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
    </SafeAreaView>
  );
}