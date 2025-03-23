import { useState, useRef } from 'react';
import { StyleSheet, TextInput, FlatList, Image, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { SessionTimer } from '../components/SessionTimer';
import WebView from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

// YouTube Player States
const YT = {
  PlayerState: {
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
    CUED: 5
  }
};

interface VideoItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: {
        url: string;
      };
    };
  };
}

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const extractVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const togglePlayPause = () => {
    const script = isPlaying ? 
      'window.player.pauseVideo();' : 
      'window.player.playVideo();';
    
    webViewRef.current?.injectJavaScript(script);
  };

  const handlePlayerStateChange = (state: number) => {
    switch (state) {
      case YT.PlayerState.PLAYING:
        setIsPlaying(true);
        break;
      case YT.PlayerState.PAUSED:
        setIsPlaying(false);
        break;
      case YT.PlayerState.ENDED:
        // Restart the video when it ends
        webViewRef.current?.injectJavaScript('window.player.seekTo(0); window.player.playVideo();');
        break;
      default:
        break;
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    const videoId = extractVideoId(searchQuery);
    if (videoId) {
      setCurrentVideo(videoId);
      setVideos([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&key=AIzaSyACEYxQ50HzKTOjgiouw-04SaVRrHYe4k8YOUR_API_KEY`
      );
      const data = await response.json();
      setVideos(data.items || []);
      setCurrentVideo(null);
    } catch (error) {
      console.error('Error searching YouTube:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderVideoItem = ({ item }: { item: VideoItem }) => (
    <TouchableOpacity 
      style={styles.videoItem}
      onPress={() => setCurrentVideo(item.id.videoId)}
    >
      <Image
        source={{ uri: item.snippet.thumbnails.default.url }}
        style={styles.thumbnail}
      />
      <ThemedView style={styles.videoInfo}>
        <ThemedText type="defaultSemiBold" numberOfLines={2}>
          {item.snippet.title}
        </ThemedText>
        <ThemedText numberOfLines={2} style={styles.description}>
          {item.snippet.description}
        </ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );

  const youtubeHTML = `
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
          function onYouTubeIframeAPIReady() {
            window.player = new YT.Player('player', {
              videoId: '${currentVideo}',
              playerVars: {
                'rel': 0,
                'showinfo': 0,
                'modestbranding': 1,
                'controls': 0,
                'autoplay': 0,
                'loop': 1,
                'playlist': '${currentVideo}'
              },
              events: {
                'onStateChange': onPlayerStateChange,
                'onReady': onPlayerReady
              }
            });
          }
          function onPlayerStateChange(event) {
            window.ReactNativeWebView.postMessage(event.data);
          }
          function onPlayerReady(event) {
            // Don't autoplay when ready
            event.target.pauseVideo();
          }
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.mainContent}>
          <ThemedView style={styles.headerContent}>
            <ThemedText style={styles.heading}>
              Download, Edit, Save and Loop YouTube Videos
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.searchContent}>
            <ThemedView style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search YouTube videos or paste URL..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.controlsContainer}>
            <TouchableOpacity 
              style={[styles.controlButton, !currentVideo && styles.controlButtonDisabled]}
              onPress={togglePlayPause}
              disabled={!currentVideo}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={32} 
                color="#fff" 
              />
            </TouchableOpacity>
          </ThemedView>

          {loading ? (
            <ActivityIndicator size="large" style={styles.loader} />
          ) : (
            <FlatList
              data={videos}
              renderItem={renderVideoItem}
              keyExtractor={(item) => item.id.videoId}
              contentContainerStyle={styles.listContainer}
              style={styles.list}
            />
          )}
        </ThemedView>

        {currentVideo && (
          <ThemedView style={styles.videoContainer}>
            <WebView
              ref={webViewRef}
              style={styles.video}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              source={{ html: youtubeHTML }}
              onMessage={(event) => {
                const state = parseInt(event.nativeEvent.data);
                handlePlayerStateChange(state);
              }}
            />
          </ThemedView>
        )}
        <SessionTimer variant="main" />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  headerContent: {
    flex: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  searchContent: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    color: '#fff',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    width: '100%',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#333',
    color: '#fff',
    width: '80%',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00a86b',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  controlButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.7,
  },
  videoContainer: {
    width: Dimensions.get('window').width,
    height: 240,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  videoItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  thumbnail: {
    width: 120,
    height: 90,
  },
  videoInfo: {
    flex: 1,
    padding: 8,
  },
  description: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
});
