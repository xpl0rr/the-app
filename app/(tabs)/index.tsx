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
import { useRoute, RouteProp, useNavigation, NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Define a type for the navigation parameters
type RootStackParamList = {
  index: { // Assuming 'index' is the route name for HomeScreen
    videoId?: string; // Make optional for initial load
    title?: string;
    startTime?: number;
    endTime?: number;
  };
  // Add other routes here if your app has more screens in this navigator
};

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
  const route = useRoute<RouteProp<RootStackParamList, 'index'>>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0);
  const [videoPlayerReady, setVideoPlayerReady] = useState<boolean>(false);
  const [initialClipStartTime, setInitialClipStartTime] = useState<number | undefined>(undefined);
  const [initialClipEndTime, setInitialClipEndTime] = useState<number | undefined>(undefined);
  const webViewRef = useRef<WebView>(null);
  const API_KEY = (Constants.expoConfig?.extra?.googleApiKey as string) || '';

  // Function to generate HTML for YouTube player
  const getYoutubeHTML = (videoId: string, startSeconds?: number, endSeconds?: number) => {
    console.log('getYoutubeHTML called with videoId:', videoId, 'startSeconds:', startSeconds, 'endSeconds:', endSeconds);
    let playerVars = {
      'playsinline': 1,
      'controls': 1, // Show controls
      'rel': 0, // Do not show related videos
      'showinfo': 0, // Do not show video title, uploader
      'modestbranding': 1, // Minimal YouTube branding
      'autoplay': 1, // Autoplay the video
      'loop': 0, // Loop the video (handled by onPlayerStateChange for clips)
      'fs': 0, // Disable fullscreen button
      'iv_load_policy': 3, // Do not show video annotations
      'start': startSeconds !== undefined ? Math.round(startSeconds) : undefined,
      // 'end': endSeconds !== undefined ? Math.round(endSeconds) : undefined, // 'end' is problematic for looping, handled manually
    };

    // If it's a clip (endSeconds is defined), set the playlist to the videoId to enable looping API
    // if (endSeconds !== undefined) {
    //   playerVars.playlist = videoId;
    // }

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; background-color: #000; overflow: hidden; }
            .video-container { position: relative; width: 100%; height: 100%; }
            iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
            #message_container_test { position: absolute; top: 10px; left: 10px; color: green; font-size: 18px; z-index: 9999; }
        </style>
    </head>
    <body>
        <div id="player" class="video-container"></div>
        <div id="message_container_test">Initial Script Test OK</div>
        <script>
            var tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            var player;
            var playerReady = false;
            var initialStartSeconds = ${startSeconds !== undefined ? startSeconds : 'null'};
            var initialEndSeconds = ${endSeconds !== undefined ? endSeconds : 'null'};
            var isClip = initialEndSeconds !== null;

            function onYouTubeIframeAPIReady() {
                console.log('YT API Ready. VideoId:', '${videoId}');
                player = new YT.Player('player', {
                    height: '100%',
                    width: '100%',
                    videoId: '${videoId}',
                    playerVars: ${JSON.stringify(playerVars)},
                    events: {
                        'onReady': onPlayerReady,
                        'onStateChange': onPlayerStateChange,
                        'onError': onPlayerError
                    }
                });
            }

            function onPlayerReady(event) {
                console.log('Player Ready. Autoplaying...');
                // event.target.playVideo(); // Autoplay is set in playerVars
                playerReady = true;
                window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'playerReady', duration: player.getDuration() }));
                window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'playerFullyReady' }));
                document.getElementById('message_container_test').style.color = 'blue';
                document.getElementById('message_container_test').innerText = 'Player Ready!';
            }

            function onPlayerStateChange(event) {
                var state = event.data;
                var currentTime = player.getCurrentTime ? player.getCurrentTime() : 0;
                window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'playerStateChange', state: state, currentTime: currentTime }));
                console.log('Player state changed:', state, 'isClip:', isClip, 'start:', initialStartSeconds, 'end:', initialEndSeconds);

                if (state === YT.PlayerState.ENDED && isClip && initialStartSeconds !== null) {
                    console.log('Clip ended, seeking to start:', initialStartSeconds);
                    player.seekTo(initialStartSeconds, true);
                    player.playVideo(); 
                    window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'clipLooped' }));
                }
            }

            function onPlayerError(event) {
                console.error('YT Player Error:', event.data);
                window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'playerError', errorCode: event.data }));
                document.getElementById('message_container_test').style.color = 'red';
                document.getElementById('message_container_test').innerText = 'Player Error: ' + event.data;
            }

            // Functions to be called from React Native
            function playVideo() {
                try {
                    if (player && player.playVideo) player.playVideo();
                } catch (e) { console.error('Error in playVideo:', e); }
            }
            function pauseVideo() {
                try {
                    if (player && player.pauseVideo) player.pauseVideo();
                } catch (e) { console.error('Error in pauseVideo:', e); }
            }
            function seekTo(seconds, allowSeekAhead) {
                try {
                    if (player && player.seekTo) player.seekTo(seconds, allowSeekAhead);
                } catch (e) { console.error('Error in seekTo:', e); }
            }
            function getCurrentTime() {
                try {
                    if (player && player.getCurrentTime) return player.getCurrentTime();
                } catch (e) { console.error('Error in getCurrentTime:', e); }
                return 0;
            }
            function getDuration() {
                try {
                    if (player && player.getDuration) return player.getDuration();
                } catch (e) { console.error('Error in getDuration:', e); }
                return 0;
            }

            // Initial message to confirm script is running
            window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'initialScriptTest', message: 'Script loaded and running.' }));

        </script>
    </body>
    </html>
    `;
  };

  const htmlContent = useMemo(() => {
    if (currentVideo && currentVideo.id) {
      // console.log('useMemo: Recalculating HTML content for WebView with videoId:', currentVideo.id.videoId, 'start:', initialClipStartTime, 'end:', initialClipEndTime);
      return getYoutubeHTML(currentVideo.id.videoId, initialClipStartTime, initialClipEndTime);
    }
    return ''; // Return empty string if no current video, WebView is conditionally rendered anyway
  }, [currentVideo?.id?.videoId, initialClipStartTime, initialClipEndTime]);

  useEffect(() => {
    if (currentVideo === null) {
      setVideoPlayerReady(false);
      setVideoDuration(0);
      setCurrentVideoTime(0);
      setCurrentVideoTitle('');
      setInitialClipStartTime(undefined); // Reset clip times
      setInitialClipEndTime(undefined);   // Reset clip times
    }
  }, [currentVideo]);

  // SIMULATE LOADING A SAVED CLIP (e.g. via navigation params)
  // In a real scenario, this effect would listen to route.params from react-navigation
  // For now, you can manually trigger this by calling a function that sets these states.
  // Example: const loadSavedClip = (clip) => { /* set states here */ }
  // useEffect(() => {
  //   const clipToLoad = route.params?.savedClip; // Example from react-navigation
  //   if (clipToLoad) {
  //     setCurrentVideo(clipToLoad.videoId);
  //     setCurrentVideoTitle(clipToLoad.title);
  //     setInitialClipStartTime(clipToLoad.startTime);
  //     setInitialClipEndTime(clipToLoad.endTime);
  //     setCurrentVideoTime(clipToLoad.startTime); // Start playback from here
  //     setVideoPlayerReady(false); // Player will re-initialize
  //     // Clear params if necessary: navigation.setParams({ savedClip: undefined })
  //   }
  // }, [route.params?.savedClip]);

  // Effect to handle incoming navigation parameters for saved clips
  useEffect(() => {
    const params = route.params;
    if (params && params.videoId) {
      const navigatedClipData: VideoItem = {
        id: { videoId: params.videoId },
        snippet: {
          title: params.title || 'Video',
          description: '', // Placeholder
          thumbnails: { default: { url: '' } } // Placeholder
        }
      };
      setCurrentVideo(navigatedClipData);
      setCurrentVideoTitle(params.title || 'Video');
      setInitialClipStartTime(params.startTime);
      setInitialClipEndTime(params.endTime);
      setCurrentVideoTime(params.startTime || 0);
      setVideoPlayerReady(false); // Ensure player re-initializes
      setSearchQuery(''); // Clear search
      setVideos([]);    // Clear search results

      // Clear the params to prevent re-triggering
      navigation.setParams({
        videoId: undefined,
        title: undefined,
        startTime: undefined,
        endTime: undefined,
      });
    }
  }, [route.params?.videoId, navigation]); // Depend on videoId from params

  // Save clip to AsyncStorage
  const saveClip = async (title: string, startTime: number, endTime: number) => {
    if (!currentVideo || !currentVideo.id) {
      console.error('Cannot save clip: currentVideo or currentVideo.id is null');
      Alert.alert('Error', 'Could not save clip. Video data is missing.');
      return;
    }

    const newClip = {
      id: Date.now().toString(), // Unique ID for this saved clip entry
      videoId: currentVideo.id.videoId, // The actual YouTube video ID
      title: title, // User-defined title for this clip
      startTime: startTime,
      endTime: endTime,
      isClip: true, // Mark as a clip
      savedAt: Date.now(), // Timestamp of when it was saved
      // originalVideoTitle: currentVideo.snippet.title, // Not in SavedVideo interface in VideoStorage
      // thumbnailUrl: currentVideo.snippet.thumbnails.default.url, // Not in SavedVideo interface in VideoStorage
    };

    try {
      const existingClipsJson = await AsyncStorage.getItem('savedClips');
      const clips = existingClipsJson ? JSON.parse(existingClipsJson) : [];
      
      clips.push(newClip);
      
      await AsyncStorage.setItem('savedClips', JSON.stringify(clips));
      console.log('Clip saved successfully:', newClip);
      Alert.alert('Clip Saved', `"${title}" has been saved.`);
      // After saving, clear currentVideo to return to search/list view
      // This is already handled by the .then(() => setCurrentVideo(null)) in the onSave prop
    } catch (error) {
      console.error('Error saving clip to AsyncStorage:', error);
      Alert.alert('Save Error', 'Failed to save the clip. Please try again.');
    }
  };


  // Extract video ID from URL
  const extractVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Handle video selection
  const handleVideoSelect = (video: VideoItem) => {
    setCurrentVideo(video);
    setCurrentVideoTitle(video.snippet.title);
    setInitialClipStartTime(undefined); // Reset for non-clipped video
    setInitialClipEndTime(undefined);   // Reset for non-clipped video
    setVideoPlayerReady(false);
    setVideoDuration(0);
    setCurrentVideoTime(0);
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
        setVideoPlayerReady(true);
      } else if (message.type === 'currentTime') { // This is the correct place for currentTime
        if (message.time !== null && typeof message.time === 'number') {
          setCurrentVideoTime(message.time);
          console.log('Current time updated from WebView:', message.time); // Specific log
        }
      } else if (message.type === 'clipEnded') {
        console.log('Clip ended message received in HomeScreen');
      } else if (message.type === 'playerStateChange') {
        console.log('Player state changed:', message.state, 'at time:', message.currentTime);
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
      const videoDataItem: VideoItem = {
        id: { videoId: videoId },
        snippet: {
          title: 'YouTube Video', // Consider fetching actual title later if needed
          description: '',
          thumbnails: { default: { url: '' } }
        }
      };
      setCurrentVideo(videoDataItem);
      setCurrentVideoTitle('YouTube Video');
      setVideos([]);
      setInitialClipStartTime(undefined); // Reset for non-clipped video
      setInitialClipEndTime(undefined);   // Reset for non-clipped video
      setVideoPlayerReady(false);
      setVideoDuration(0);
      setCurrentVideoTime(0);
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
  if (currentVideo && currentVideo.id) { // Ensure currentVideo.id is also defined
    // VIDEO VIEW - Show when a video is selected
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.videoContentContainer}>
          <SafeAreaView style={{ flex: 1, width: '100%' }}>
            {/* Video Player Section - Add top padding to ensure visibility */}
            <View style={[styles.videoWrapper, { paddingTop: 24 }]}>
              <WebView
                ref={webViewRef}
                key={(currentVideo && currentVideo.id) ? `${currentVideo.id.videoId}-${initialClipStartTime}-${initialClipEndTime}` : 'webview-initial'}
                source={{ 
                  html: htmlContent, 
                  baseUrl: 'https://www.youtube.com' 
                }}
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
              {currentVideo && (
                <VideoEditor
                  videoId={currentVideo.id!.videoId} // Pass the video ID, checked by outer if
                  title={currentVideoTitle} // Pass the video title
                  duration={videoDuration} // Pass actual duration
                  currentTime={currentVideoTime} // Pass current time
                  onSave={(title: string, startTime: number, endTime: number) => {
                    saveClip(title, startTime, endTime).then(() => {
                      setCurrentVideo(null); // Reset after saving
                    });
                  }}
                  webViewRef={webViewRef}
                  videoPlayerReady={videoPlayerReady}
                  initialStartTime={initialClipStartTime}
                  initialEndTime={initialClipEndTime}
                />
              )}
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