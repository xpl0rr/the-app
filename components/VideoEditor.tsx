import React, { useState, useEffect, useRef } from 'react';
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
  currentTime?: number; // Added currentTime prop
  onSave: (title: string, startTime: number, endTime: number) => void;
  onClose: () => void; // Add onClose prop to handle closing without saving
  webViewRef: any; // Consider more specific type if possible, e.g., RefObject<WebView>
  videoPlayerReady: boolean;
  initialStartTime?: number;
  initialEndTime?: number;
}

export function VideoEditor({ videoId, title, duration, currentTime: propCurrentTime, onSave, onClose, webViewRef, videoPlayerReady, initialStartTime, initialEndTime }: VideoEditorProps): React.ReactElement {
  // State declarations
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(duration);
  const [internalCurrentTime, setInternalCurrentTime] = useState(0); // Internal tracking, updated by prop or direct manipulation
  const [displayCurrentTime, setDisplayCurrentTime] = useState(propCurrentTime !== undefined ? propCurrentTime : 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreviewingClip, setIsPreviewingClip] = useState(false);

  // Ref declarations - initialized with state values
  const startTimeRef = useRef(startTime);
  const endTimeRef = useRef(endTime);
  const displayCurrentTimeRef = useRef(displayCurrentTime);

  // Update refs when their corresponding state changes
  useEffect(() => { startTimeRef.current = startTime; }, [startTime]);
  useEffect(() => { endTimeRef.current = endTime; }, [endTime]);
  useEffect(() => { displayCurrentTimeRef.current = displayCurrentTime; }, [displayCurrentTime]);

  // Update internal current time if propCurrentTime changes (e.g., from WebView messages)
  useEffect(() => {
    if (propCurrentTime !== undefined) {
      setInternalCurrentTime(propCurrentTime);
      setDisplayCurrentTime(propCurrentTime);
    }
  }, [propCurrentTime]);

  // Effect to initialize/reset startTime and endTime based on props or duration changes
  useEffect(() => {
    // Initialize with provided clip times or defaults
    const newStartTime = initialStartTime !== undefined ? initialStartTime : 0;
    const newEndTime = initialEndTime !== undefined ? initialEndTime : duration;
    // Set start and end times
    setStartTime(newStartTime);
    setEndTime(newEndTime);
    // Update refs for immediate use if needed by other effects
    startTimeRef.current = newStartTime;
    endTimeRef.current = newEndTime;
  }, [duration, initialStartTime, initialEndTime]);

  // Setup interval to check current time during playback
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isPreviewingClip && videoPlayerReady) {
      // Ensure video starts playing from the designated startTime when preview begins
      if (webViewRef.current) {
        // Starting preview. Seeking and playing.
        webViewRef.current.injectJavaScript(`
          window.seekTo(${startTimeRef.current}, true);
          window.playVideo();
          true;
        `);
      }

      interval = setInterval(() => {
        if (videoPlayerReady && webViewRef.current) { // Guard getCurrentTime
          webViewRef.current.injectJavaScript(`window.getCurrentTime(); true;`);
        }

        // Log values for debugging using refs
        // Check if loop condition is met

        if (displayCurrentTimeRef.current >= endTimeRef.current && videoPlayerReady && webViewRef.current) { // Guard loop's seek/play
          // Loop condition met - seeking to start and playing
          webViewRef.current.injectJavaScript(`
            window.seekTo(${startTimeRef.current}, true);
            window.playVideo();
            true;
          `);
        } else if (webViewRef.current) {
          // Loop condition not met
        }
      }, 500); // Check every 500ms
    } else {
      // If not previewing, ensure the video is paused
      if (videoPlayerReady && webViewRef.current) { // Guard pauseVideo
        webViewRef.current.injectJavaScript(`window.pauseVideo(); true;`);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
      // Ensure video is paused when the component unmounts or isPreviewingClip becomes false
      if (videoPlayerReady && webViewRef.current) { // Guard pauseVideo in cleanup
        webViewRef.current.injectJavaScript(`window.pauseVideo(); true;`);
      }
    };
  }, [isPreviewingClip, videoPlayerReady, startTime, endTime, webViewRef]);

  const handleSave = (isClip: boolean) => {
    const finalStartTime = isClip ? startTime : 0;
    const finalEndTime = isClip ? endTime : duration;

    if (isClip && finalStartTime >= finalEndTime) {
      Alert.alert("Invalid Selection", "End time must be greater than start time for a clip.");
      return;
    }
    // Call the onSave prop passed from HomeScreen with the determined values
    onSave(title, finalStartTime, finalEndTime);
  };

  const seekTo = (time: number) => {
    try {
      if (videoPlayerReady && webViewRef && webViewRef.current) { // Guard seekTo
        console.log('Seeking to:', time);
        webViewRef.current.injectJavaScript(`window.seekTo(${time}, true); true;`);
        // When seeking, update internal state if not relying solely on prop
        setInternalCurrentTime(time);
        // If HomeScreen is expected to update propCurrentTime via messages, this might be redundant
        // or could be a direct call to setCurrentVideoTime if passed down.
      } else {
        console.log('WebView ref not available');
      }
    } catch (error) {
      console.error('Error in seekTo:', error);
    }
  };

  const playClip = () => {
    if (startTime >= endTime && !isPlaying) { // only validate if trying to start play
      Alert.alert("Invalid Selection", "End time must be greater than start time");
      return;
    }

    try {
      if (isPlaying) { // If currently playing (and thus previewing a loop)
        setIsPlaying(false);
        setIsPreviewingClip(false); // This will trigger the useEffect cleanup to pause video
      } else { // If paused, start playing the loop
        setIsPlaying(true);
        setIsPreviewingClip(true); // This will trigger the useEffect to start the loop
        // The useEffect now handles seeking to startTime and playing.
        // No immediate JS injection needed here as useEffect will handle it.
      }
    } catch (error) {
      console.error('Error in playClip:', error);
      // Revert UI state in case of an error during state transition
      setIsPreviewingClip(false);
      setIsPlaying(false);
    }
  };

  const handleSliderStartChange = (value: number) => {
    // Handle slider start change
    // Prevent start time from exceeding end time
    const newStartTime = Math.min(value, endTime - 1);
    // Setting new start time
    setStartTime(newStartTime);
    
    // If currently previewing, update playback position
    if (isPreviewingClip) {
      seekTo(newStartTime);
    }
  };

  const handleSliderEndChange = (value: number) => {
    // Handle slider end change
    // Prevent end time from being less than start time
    const newEndTime = Math.max(value, startTime + 1);
    // Setting new end time
    setEndTime(newEndTime);
  };

  // VideoEditor current state values
  return (
    <ThemedView style={styles.expandedContainer}>
      {/* Title area */}
      <View style={styles.titleRow}>
        <ThemedText style={styles.videoTitle}>{title}</ThemedText>
        <TouchableOpacity 
          style={styles.titleCloseButton}
          onPress={onClose} // Now properly closes without saving
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
        <ThemedText style={styles.timeDisplay}>{formatTime(startTime)} - {formatTime(endTime)} (Current: {formatTime(displayCurrentTime)})</ThemedText>
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
              maximumValue={Math.max(1, duration)}
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
              maximumValue={Math.max(1, duration)}
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
          onPress={() => handleSave(true)} // Save as clip
        >
          <Ionicons name="save-outline" size={22} color="#fff" />
          <ThemedText style={styles.buttonLabel}>Save Clip</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => handleSave(false)} // Save full video
        >
          <Ionicons name="albums-outline" size={22} color="#fff" />
          <ThemedText style={styles.buttonLabel}>Save Full</ThemedText>
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