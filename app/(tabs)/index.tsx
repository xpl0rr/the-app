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
    container: { flex: 1, padding: 16 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, paddingHorizontal: 8 },
    thumbnail: { width: '100%', height: 200, marginBottom: 8 },
    videoTitle: { marginBottom: 16 },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search YouTube"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity onPress={handleSearch}>
          <Ionicons name="search" size={24} />
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator />}
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
    </SafeAreaView>
  );
}