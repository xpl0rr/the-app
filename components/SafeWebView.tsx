import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView, WebViewProps } from 'react-native-webview';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface SafeWebViewProps extends WebViewProps {
  fallbackComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  maxRetries?: number;
}

/**
 * A WebView wrapper that handles errors gracefully
 * Particularly useful for YouTube WebView integration
 */
const SafeWebView = forwardRef<WebView, SafeWebViewProps>((props, ref) => {
  const {
    fallbackComponent,
    loadingComponent,
    maxRetries = 3,
    ...webViewProps
  } = props;
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const webViewRef = React.useRef<WebView>(null);
  
  // Forward the ref to allow parent components to call WebView methods
  useImperativeHandle(ref, () => ({
    // Forward all methods from the internal WebView
    ...(webViewRef.current || {}),
    // Add custom methods
    reload: () => {
      setHasError(false);
      setRetryCount(0);
      webViewRef.current?.reload();
    }
  }));
  
  const handleError = () => {
    if (retryCount < maxRetries) {
      // Auto retry
      setRetryCount(prev => prev + 1);
      setTimeout(() => {
        webViewRef.current?.reload();
      }, 1000);
    } else {
      setHasError(true);
    }
  };
  
  const renderLoading = () => {
    if (loadingComponent) {
      return loadingComponent;
    }
    
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2176FF" />
        <ThemedText style={styles.loadingText}>
          Loading player...
        </ThemedText>
      </ThemedView>
    );
  };
  
  const renderError = () => {
    if (fallbackComponent) {
      return fallbackComponent;
    }
    
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>
          Failed to load the video player
        </ThemedText>
        <View style={styles.retryButton}>
          <ThemedText 
            style={styles.retryText}
            onPress={() => {
              setHasError(false);
              setRetryCount(0);
              webViewRef.current?.reload();
            }}>
            Retry
          </ThemedText>
        </View>
      </ThemedView>
    );
  };
  
  if (hasError) {
    return renderError();
  }
  
  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        {...webViewProps}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={handleError}
        onHttpError={handleError}
      />
      {isLoading && renderLoading()}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2176FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    overflow: 'hidden',
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default SafeWebView;
