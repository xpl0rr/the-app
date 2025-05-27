import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Alert, View } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';

interface VideoEditorProps {
  videoId: string;
  title: string;
  duration: number;
  onSave: () => void;
  webViewRef: any;
}

export function VideoEditor({ videoId, title, duration, onSave, webViewRef }: VideoEditorProps): React.ReactElement {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(duration);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreviewingClip, setIsPreviewingClip] = useState(false);

  // Reset end time when duration changes
  useEffect(() => {
    setEndTime(duration);
  }, [duration]);

  // Setup interval to check current time during playback
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (isPreviewingClip) {
      interval = setInterval(() => {
        // Get current playback time
        webViewRef.current?.injectJavaScript(`
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'currentTime',
            value: window.player.getCurrentTime()
          }));
          true;
        `);
        
        // Check if we need to loop back to start time
        if (currentTime >= endTime) {
          seekTo(startTime);
        }
      }, 500);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPreviewingClip, currentTime, startTime, endTime]);

  const saveVideo = async (isClip: boolean) => {
    try {
      // Basic validation
      if (isClip && startTime >= endTime) {
        Alert.alert("Invalid Selection", "End time must be greater than start time");
        return;
      }
      
      const savedVideos = await AsyncStorage.getItem('savedVideos');
      const videos = savedVideos ? JSON.parse(savedVideos) : [];
      
      const newVideo = {
        id: Date.now().toString(),
        title,
        videoId,
        startTime: isClip ? startTime : 0,
        endTime: isClip ? endTime : duration,
        isClip,
        savedAt: Date.now(),
      };

      videos.push(newVideo);
      await AsyncStorage.setItem('savedVideos', JSON.stringify(videos));
      onSave();
      Alert.alert('Success', `Video ${isClip ? 'clip' : ''} saved successfully!`);
    } catch (error) {
      console.error('Error saving video:', error);
      Alert.alert('Error', 'Failed to save video');
    }
  };

  const seekTo = (time: number) => {
    try {
      if (webViewRef && webViewRef.current) {
        console.log('Seeking to:', time);
        webViewRef.current.injectJavaScript(`
          if (window.executeCommand) {
            window.executeCommand('seekTo', ${time});
            console.log('Seek command executed via direct command');
          } else if (window.player && window.player.seekTo) {
            window.player.seekTo(${time});
            console.log('Seek command sent to player directly');
          } else {
            console.log('Player not ready for seeking');
          }
          true;
        `);
        setCurrentTime(time);
      } else {
        console.log('WebView ref not available');
      }
    } catch (error) {
      console.error('Error in seekTo:', error);
    }
  };

  const playClip = () => {
    // Basic validation
    if (startTime >= endTime) {
      Alert.alert("Invalid Selection", "End time must be greater than start time");
      return;
    }
    
    try {
      // Toggle between play and pause
      if (isPlaying) {
        // If already playing, pause the video
        setIsPlaying(false);
        setIsPreviewingClip(false);
        
        webViewRef.current?.injectJavaScript(`
          if (window.pauseVideo) {
            window.pauseVideo();
          } else if (player) {
            player.pauseVideo();
          }
          true;
        `);
      } else {
        // If paused, start playing from the selected start time
        setIsPlaying(true);
        setIsPreviewingClip(true);
        
        webViewRef.current?.injectJavaScript(`
          // First seek to the start time
          if (window.seekTo) {
            window.seekTo(${startTime});
          } else if (player) {
            player.seekTo(${startTime}, true);
          }
          
          // Then play the video
          if (window.playVideo) {
            window.playVideo();
          } else if (player) {
            player.playVideo();
          }
          
          // We'll set up a timer to pause at the end time
          clearTimeout(window.clipEndTimer);
          window.clipEndTimer = setTimeout(() => {
            if (window.pauseVideo) {
              window.pauseVideo();
            } else if (player) {
              player.pauseVideo();
            }
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'clipEnded'
            }));
          }, (${endTime - startTime}) * 1000);
          
          true;
        `);
      }
    } catch (error) {
      console.error('Error in playClip:', error);
      // Revert UI state if there was an error
      setIsPreviewingClip(false);
      setIsPlaying(false);
    }
  };

  const handleSliderStartChange = (value: number) => {
    // Prevent start time from exceeding end time
    const newStartTime = Math.min(value, endTime - 1);
    setStartTime(newStartTime);
    
    // If currently previewing, update playback position
    if (isPreviewingClip) {
      seekTo(newStartTime);
    }
  };

  const handleSliderEndChange = (value: number) => {
    // Prevent end time from being less than start time
    const newEndTime = Math.max(value, startTime + 1);
    setEndTime(newEndTime);
  };

  return (
    <ThemedView style={styles.expandedContainer}>
      {/* Title area */}
      <View style={styles.titleRow}>
        <ThemedText style={styles.videoTitle}>{title}</ThemedText>
        <TouchableOpacity 
          style={styles.titleCloseButton}
          onPress={onSave}
        >
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Time display row */}
      <View style={styles.timeRow}>
        <ThemedText style={styles.timeLabelSmall}>Start:</ThemedText>
        <ThemedText style={styles.timeDisplay}>{formatTime(startTime)}</ThemedText>
        <View style={styles.spacer} />
        <ThemedText style={styles.timeLabelSmall}>End:</ThemedText>
        <ThemedText style={styles.timeDisplay}>{formatTime(endTime)}</ThemedText>
        <View style={styles.spacer} />
        <ThemedText style={styles.timeLabelSmall}>Duration:</ThemedText>
        <ThemedText style={styles.timeDisplay}>{formatTime(endTime - startTime)}</ThemedText>
      </View>

      {/* Timeline scrubber area */}
      <View style={styles.scrubberContainer}>
        <View style={styles.timelineTrack}>
          <View 
            style={[styles.timelineSelection, {
              left: `${(startTime / duration) * 100}%`,
              width: `${((endTime - startTime) / duration) * 100}%`
            }]}
          />
          
          {/* Start handle */}
          <TouchableOpacity 
            style={[styles.timelineHandle, {
              left: `${(startTime / duration) * 100}%`
            }]}
            onPress={() => seekTo(startTime)}
          >
            <View style={styles.handleIndicator} />
          </TouchableOpacity>
          
          {/* End handle */}
          <TouchableOpacity 
            style={[styles.timelineHandle, {
              left: `${(endTime / duration) * 100}%`
            }]}
            onPress={() => seekTo(endTime)}
          >
            <View style={styles.handleIndicator} />
          </TouchableOpacity>
        </View>
        
        {/* Sliders for precise control */}
        <View style={styles.slidersContainer}>
          <View style={styles.sliderRow}>
            <ThemedText style={styles.sliderLabel}>Start:</ThemedText>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration}
              value={startTime}
              onValueChange={handleSliderStartChange}
              minimumTrackTintColor="#555"
              maximumTrackTintColor="#333"
              thumbTintColor="#00a86b"
              step={1}
            />
          </View>
          
          <View style={styles.sliderRow}>
            <ThemedText style={styles.sliderLabel}>End:</ThemedText>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration}
              value={endTime}
              onValueChange={handleSliderEndChange}
              minimumTrackTintColor="#555"
              maximumTrackTintColor="#333"
              thumbTintColor="#00a86b"
              step={1}
            />
          </View>
        </View>
      </View>

      {/* Control buttons */}
      <View style={styles.controlsRow}>
        <TouchableOpacity 
          style={[styles.controlButton, isPreviewingClip && styles.activeButton]}
          onPress={playClip}
        >
          <Ionicons name={isPreviewingClip ? "pause" : "play"} size={22} color="#fff" />
          <ThemedText style={styles.buttonLabel}>{isPreviewingClip ? "Pause" : "Preview"}</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => saveVideo(true)}
        >
          <Ionicons name="save" size={22} color="#fff" />
          <ThemedText style={styles.buttonLabel}>Save Clip</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  // Expanded editor styles
  expandedContainer: {
    backgroundColor: '#111',
    width: '100%',
    height: '100%',
    padding: 10,
    flexDirection: 'column',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  titleCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  timeLabelSmall: {
    color: '#aaa',
    fontSize: 12,
    marginRight: 5,
  },
  timeDisplay: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 10,
  },
  spacer: {
    width: 10,
  },
  scrubberContainer: {
    marginVertical: 10,
    justifyContent: 'center',
  },
  slidersContainer: {
    marginTop: 20,
    width: '100%',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sliderLabel: {
    color: '#aaa',
    fontSize: 12,
    width: 50,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  controlButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#333',
    minWidth: 100,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
  },
  
  // Timeline styles
  timelineWrapper: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  
  // Keep original timeline styles for compatibility
  timelineContainer: {
    backgroundColor: '#111',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 0,
    width: '100%',
    paddingTop: 6,
    paddingBottom: 6,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    height: 32,
  },
  timelineButton: {
    backgroundColor: '#333',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: '#00a86b',
  },
  timeLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  durationBadge: {
    backgroundColor: '#00a86b',
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  timelineCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineScrubber: {
    height: 40,
    marginTop: 4,
    position: 'relative',
  },
  timelineTrack: {
    backgroundColor: '#333',
    height: 10,
    borderRadius: 5,
    marginHorizontal: 10,
    marginTop: 15,
    position: 'relative',
  },
  timelineSelection: {
    position: 'absolute',
    top: 0,
    height: '100%',
    backgroundColor: '#00a86b',
    borderRadius: 5,
  },
  timelineHandle: {
    position: 'absolute',
    top: -5,
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00a86b',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  handleIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  timelineSlider: {
    position: 'absolute',
    width: '100%',
    height: 40,
    opacity: 0.5, // Semi-transparent to show it's interactive
    top: 0,
  },

  // Keep necessary old styles for compatibility
  container: { 
    padding: 12,
    backgroundColor: '#333',
    borderRadius: 8,
    margin: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  compactSliderRow: {
    marginVertical: 5,
  },
  compactSlider: {
    width: '100%',
    height: 30,
    marginBottom: 5,
  },
  clipDuration: {
    textAlign: 'center',
    marginVertical: 5,
    fontSize: 16,
    color: '#00a86b',
    fontWeight: 'bold',
  },
  compactControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 5,
  },
  compactButton: {
    backgroundColor: '#222',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 4,
    flexDirection: 'row',
  },
  compactButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 14,
  },
}); 