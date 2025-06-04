# Implementing AirPlay in React Native Apps

This guide provides step-by-step instructions for implementing AirPlay functionality in any React Native application.

## 1. WebView Configuration

Ensure your WebView is properly configured to support AirPlay:

```jsx
<WebView
  // Essential AirPlay-related props
  allowsInlineMediaPlayback={true}
  mediaPlaybackRequiresUserAction={false}
  allowsAirPlayForMediaPlayback={true}
  
  // Other standard props
  javaScriptEnabled={true}
  domStorageEnabled={true}
  scrollEnabled={false}
  bounces={false}
  allowsFullscreenVideo={false}
/>
```

## 2. HTML/CSS Enhancements

If you're generating HTML content for your WebView, include these enhancements:

```javascript
const generateHTML = () => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <style>
        /* Force video elements to allow AirPlay */
        video { -webkit-airplay: allow !important; }
        video::-webkit-media-controls { display: inline !important; }
        video::-webkit-media-controls-airplay-button { display: inline !important; }
        
        /* Other standard styling */
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; background-color: #000; }
      </style>
    </head>
    <body>
      <!-- Your content here -->
    </body>
    </html>
  `;
};
```

## 3. Video Player Configuration

When configuring any video player in your app, include these parameters:

```javascript
const videoPlayerConfig = {
  playsinline: true,      // Play video inline (important for AirPlay)
  controls: true,         // Show player controls
  autoplay: true          // Auto-play the video if desired
};
```

## 4. Creating an AirPlay Button

Add an AirPlay button that provides instructions to users:

```jsx
import { TouchableOpacity, View, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Text } from 'react-native';

// Inside your component
const AirPlayButton = () => {
  if (Platform.OS !== 'ios') return null;
  
  return (
    <TouchableOpacity
      style={styles.airPlayButtonContainer}
      onPress={() => {
        // Show instructions alert
        Alert.alert(
          'AirPlay Instructions',
          'To use AirPlay with this app:\n\n' +
          '1. Swipe DOWN from the top-right corner of your screen to open Control Center\n' +
          '2. Tap the AirPlay button (rectangle with triangle)\n' +
          '3. Select your AirPlay device\n\n' +
          'The content should then appear on your external display.',
          [{ text: 'OK', style: 'default' }]
        );
      }}
    >
      <View style={styles.airPlayButton}>
        <MaterialIcons name="airplay" size={24} color="white" />
        <Text style={styles.airPlayText}>AirPlay</Text>
      </View>
    </TouchableOpacity>
  );
};
```

## 5. Styling

Add these styles to your component:

```javascript
const styles = StyleSheet.create({
  airPlayButtonContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  airPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 8,
  },
  airPlayText: {
    fontSize: 14,
    color: 'white',
    marginLeft: 8,
  },
});
```

## Common Pitfalls & Solutions

### 1. AirPlay Button Not Showing Device Menu

**Solution**: Instead of trying to programmatically trigger the AirPlay menu (which often fails with YouTube), direct users to use the Control Center for a more reliable experience.

### 2. Video Not Appearing on External Display

**Solution**: Ensure you have:
- Set `allowsAirPlayForMediaPlayback={true}` on WebView
- Added `-webkit-airplay: allow !important;` CSS for video elements
- Configured video to play inline with `playsinline: 1`

### 3. Custom Video Controls Not Working on AirPlay Display

**Solution**: If you have custom video controls, ensure they work by using standard video control APIs that are compatible with AirPlay:

```javascript
// Example of controlling video with compatible methods
const playVideo = () => {
  if (videoRef.current) {
    videoRef.current.play();
  }
};

const pauseVideo = () => {
  if (videoRef.current) {
    videoRef.current.pause();
  }
};
```

## Testing AirPlay

1. Ensure your iOS device and AirPlay receiver are on the same WiFi network
2. Open your app and navigate to video content
3. Use Control Center (swipe down from top-right) to select your AirPlay device
4. Verify that video appears on external display and maintains any custom functionality (like looping)

## Troubleshooting

- **No devices appearing**: Check WiFi connection and ensure AirPlay is enabled in iOS Settings
- **Content appears but with poor quality**: Check if you need to adjust resolution settings for AirPlay
- **Black screen on external display**: Try rebuilding your app for iOS development profile

Remember that direct programmatic access to AirPlay APIs is limited by iOS security restrictions, which is why we guide users to use the native iOS Control Center for the most reliable AirPlay experience.