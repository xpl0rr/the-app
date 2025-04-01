import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Alert } from 'react-native';
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

export function VideoEditor({ videoId, title, duration, onSave, webViewRef }: VideoEditorProps) {
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
    let interval: NodeJS.Timeout | null = null;
    
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
    webViewRef.current?.injectJavaScript(`
      window.player.seekTo(${time});
      true;
    `);
    setCurrentTime(time);
  };

  const playClip = () => {
    // Basic validation
    if (startTime >= endTime) {
      Alert.alert("Invalid Selection", "End time must be greater than start time");
      return;
    }
    
    seekTo(startTime);
    setIsPreviewingClip(true);
    webViewRef.current?.injectJavaScript(`
      window.player.playVideo();
      true;
    `);
    setIsPlaying(true);
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
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Edit Video</ThemedText>
      
      <ThemedView style={styles.sliderContainer}>
        <ThemedText style={styles.label}>Start Time: {formatTime(startTime)}</ThemedText>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={startTime}
          onValueChange={handleSliderStartChange}
          minimumTrackTintColor="#00a86b"
          maximumTrackTintColor="#666"
          thumbTintColor="#00a86b"
          step={1}
        />
      </ThemedView>

      <ThemedView style={styles.sliderContainer}>
        <ThemedText style={styles.label}>End Time: {formatTime(endTime)}</ThemedText>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={endTime}
          onValueChange={handleSliderEndChange}
          minimumTrackTintColor="#00a86b"
          maximumTrackTintColor="#666"
          thumbTintColor="#00a86b"
          step={1}
        />
      </ThemedView>

      <ThemedText style={styles.clipDuration}>
        Clip Duration: {formatTime(endTime - startTime)}
      </ThemedText>

      <ThemedView style={styles.controls}>
        <TouchableOpacity 
          style={[styles.button, isPreviewingClip && styles.activeButton]}
          onPress={playClip}
        >
          <Ionicons name="play" size={24} color="#fff" />
          <ThemedText style={styles.buttonText}>Play Clip</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => saveVideo(true)}
        >
          <Ionicons name="cut" size={24} color="#fff" />
          <ThemedText style={styles.buttonText}>Save Clip</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => saveVideo(false)}
        >
          <Ionicons name="save" size={24} color="#fff" />
          <ThemedText style={styles.buttonText}>Save Full</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#333',
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#fff',
  },
  sliderContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  clipDuration: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00a86b',
    textAlign: 'center',
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  button: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  activeButton: {
    backgroundColor: '#00a86b33',
  },
  buttonText: {
    color: '#fff',
    marginTop: 4,
    fontSize: 12,
  },
}); 