import { useState, useRef } from 'react';
import { StyleSheet, TextInput, FlatList, Image, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { SessionTimer } from '../components/SessionTimer';
import { VideoEditor } from '../components/VideoEditor';
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
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentVideoTitle, setCurrentVideoTitle] = useState('');
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
        // Get video duration when it starts playing
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
        webViewRef.current?.injectJavaScript('window.player.seekTo(0); window.player.playVideo();');
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
        // Handle current time updates from the WebView
        // This is used by the VideoEditor component
      } else {
        handlePlayerStateChange(parseInt(event.nativeEvent.data));
      }
    } catch (error) {
      try {
        handlePlayerStateChange(parseInt(event.nativeEvent.data));
      } catch (e) {
        console.error('Error handling WebView message:', e);
      }
    }
  };

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
      // Replace with a valid API key - this is just a placeholder
      const API_KEY = 'AIzaSyBfQ_IQd6-0pKydm5mF33lIt8bhxHH1-qo';
      
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&key=${API_KEY}`
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

  const renderVideoItem = ({ item }: { item: VideoItem }) => (
    <TouchableOpacity 
      style={styles.videoItem}
      onPress={() => handleVideoSelect(item)}
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
                'controls': 1,
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
            // Get duration immediately
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'duration',
              value: event.target.getDuration()
            }));
          }

          // Setup listener for current time updates
          setInterval(function() {
            if (window.player && window.player.getCurrentTime) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'currentTime',
                value: window.player.getCurrentTime()
              }));
            }
          }, 1000);
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView}>
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

              {currentVideo && (
                <ThemedView style={styles.videoContainer}>
                  <WebView
                    ref={webViewRef}
                    style={styles.video}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    source={{ html: youtubeHTML }}
                    onMessage={handleMessage}
                  />
                </ThemedView>
              )}

              {videoDuration > 0 && (
                <VideoEditor
                  videoId={currentVideo!}
                  title={currentVideoTitle}
                  duration={videoDuration}
                  onSave={() => {}}
                  webViewRef={webViewRef}
                />
              )}
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
                scrollEnabled={false}
              />
            )}
          </ThemedView>
        </ScrollView>
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
  scrollView: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  mainContent: {
    backgroundColor: '#1a1a1a',
    paddingBottom: 120,
  },
  headerContent: {
    backgroundColor: '#1a1a1a',
    paddingTop: 20,
    paddingBottom: 10,
  },
  searchContent: {
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    width: '100%',
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
    marginBottom: 16,
  },
  videoContainer: {
    width: '90%',
    height: 240,
    backgroundColor: '#000',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  video: {
    flex: 1,
    backgroundColor: '#000',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
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
    width: '100%',
    marginTop: 16,
  },
});
