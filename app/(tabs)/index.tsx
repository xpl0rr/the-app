import { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { SessionTimer } from '../components/SessionTimer';
import { VideoEditor } from '../components/VideoEditor';
import WebView from 'react-native-webview';
import Constants from 'expo-constants';               // ← NEW
import { Ionicons } from '@expo/vector-icons';

// YouTube Player States
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

interface VideoItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: { default: { url: string } };
  };
}

export default function HomeScreen() {
  /* ───────── state ───────── */
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentVideoTitle, setCurrentVideoTitle] = useState('');
  const webViewRef = useRef<WebView>(null);

  /* ───────── helpers ───────── */
  const API_KEY =
    (Constants.expoConfig?.extra?.googleApiKey as string) || ''; // ← NEW

  const extractVideoId = (url: string): string | null => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const togglePlayPause = () => {
    const script = isPlaying
      ? 'window.player.pauseVideo();'
      : 'window.player.playVideo();';
    webViewRef.current?.injectJavaScript(script);
  };

  const handlePlayerStateChange = (state: number) => {
    switch (state) {
      case YT.PlayerState.PLAYING:
        setIsPlaying(true);
        webViewRef.current?.injectJavaScript(`
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'duration',
            value: window.player.getDuration()
          }));
          true;
        `);
        break;
      case YT.PlayerState.PAUSED:
        setIsPlaying(false);
        break;
      case YT.PlayerState.ENDED:
        webViewRef.current?.injectJavaScript(
          'window.player.seekTo(0); window.player.playVideo();'
        );
        break;
      default:
        break;
    }
  };

  const handleVideoSelect = (video: VideoItem) => {
    setCurrentVideo(video.id.videoId);
    setCurrentVideoTitle(video.snippet.title);
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'duration') {
        setVideoDuration(data.value);
      } else if (data.type === 'currentTime') {
        /* you can handle current time here */
      } else {
        handlePlayerStateChange(parseInt(event.nativeEvent.data));
      }
    } catch {
      handlePlayerStateChange(parseInt(event.nativeEvent.data));
    }
  };

  /* ───────── search / fetch ───────── */
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
      if (data.error) {
        console.error('YouTube API Error:', data.error.message);
        alert('YouTube API Error: ' + data.error.message);
        return;
      }
      setVideos(data.items || []);
      setCurrentVideo(null);
    } catch (error) {
      console.error('Error searching YouTube:', error);
      alert('Failed to search YouTube. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  /* UI render functions */
  const renderVideoItem = ({ item }: { item: VideoItem }) => (
    <TouchableOpacity onPress={() => handleVideoSelect(item)}>
      <Image source={{ uri: item.snippet.thumbnails.default.url }} style={styles.thumbnail} />
      <ThemedText style={styles.videoTitle}>{item.snippet.title}</ThemedText>
    </TouchableOpacity>
  );

  const youtubeHTML = `
    <html>
      <body style="margin:0">
        <div id="player"></div>
        <script>
          var tag = document.createElement('script');
          tag.src = "https://www.youtube.com/iframe_api";
          var firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

          function onYouTubeIframeAPIReady() {
            window.player = new YT.Player('player', {
              height: '100%',
              width: '100%',
              videoId: '${currentVideo}',
              events: {
                'onStateChange': function(e) {
                  window.ReactNativeWebView.postMessage(e.data.toString());
                }
              }
            });
          }
        </script>
      </body>
    </html>
  `;

  // Styles for HomeScreen UI, moved above return
  const styles = StyleSheet.create({
    container: { 
      flex: 1,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 16,
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
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      padding: 8,
      width: '90%',
      borderWidth: 1,
      borderColor: '#000000',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    clearButton: {
      padding: 4,
      marginLeft: 4,
    },
    input: { 
      flex: 1, 
      height: 40, 
      borderWidth: 0, 
      borderRadius: 8, 
      paddingHorizontal: 12, 
      backgroundColor: 'transparent',
      color: '#000000',
      fontSize: 16,
      includeFontPadding: false,
    },
    thumbnail: { width: '100%', height: 200, marginBottom: 8 },
    videoTitle: { marginBottom: 16 },
    header: {
      fontSize: 24,
      textAlign: 'center',
      color: '#000000',
      marginTop: 24,
      marginBottom: 32,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ThemedText style={styles.header}>Download and Loop Videos</ThemedText>
      <View style={styles.contentContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#000000" style={{ marginLeft: 8, marginRight: 8 }} />
          <TextInput
            style={styles.input}
            placeholder="Search YouTube"
            placeholderTextColor="#666666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setVideos([]);
                setCurrentVideo(null);
              }}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color="#666666" />
            </TouchableOpacity>
          )}
        </View>
        {loading && <ActivityIndicator />}
      </View>
      
      {currentVideo && (
        <>
          <WebView
            key={currentVideo}
            ref={webViewRef}
            source={{ html: youtubeHTML }}
            onMessage={handleMessage}
            style={{ height: 200, width: Dimensions.get('window').width }}
          />
          <VideoEditor
            videoId={currentVideo}
            title={currentVideoTitle}
            duration={videoDuration}
            onSave={() => setCurrentVideo(null)}
            webViewRef={webViewRef}
          />
        </>
      )}
      
      {!currentVideo && !loading && (
        <FlatList
          data={videos}
          keyExtractor={item => item.id.videoId}
          renderItem={renderVideoItem}
        />
      )}
      
      {!currentVideo && <SessionTimer variant="main" />}
    </SafeAreaView>
  );
}