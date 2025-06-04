/**
 * Deep link handling for Looper app
 */

/**
 * Extracts video ID from YouTube URL formats
 * Supports standard youtube.com, youtu.be and youtube-nocookie.com URLs
 * 
 * @param url Any YouTube-like URL
 * @returns The video ID if found, null otherwise
 */
export const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  
  // Match patterns for various YouTube URL formats
  let patterns = [
    // youtu.be/XXXXXXXXXXX
    /youtu\.be\/([a-zA-Z0-9_-]{10,12})/,
    // youtube.com/watch?v=XXXXXXXXXXX
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{10,12})/,
    // youtube.com/embed/XXXXXXXXXXX
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{10,12})/,
    // youtube-nocookie.com/embed/XXXXXXXXXXX
    /youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{10,12})/,
    // youtube.com/v/XXXXXXXXXXX
    /youtube\.com\/v\/([a-zA-Z0-9_-]{10,12})/,
  ];
  
  for (let pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

/**
 * Extracts timestamp parameters from YouTube URLs
 * Supports t=XXs, start=XX, and end=XX parameters
 * 
 * @param url Full YouTube URL with potential timestamp parameters
 * @returns Object with start and end times if found
 */
export const extractYouTubeTimestamps = (url: string): { startTime?: number, endTime?: number } => {
  if (!url) return {};
  
  const result: { startTime?: number, endTime?: number } = {};
  
  // Look for t=XX or start=XX parameter (seconds)
  const startMatch = url.match(/[?&](t|start)=(\d+)/);
  if (startMatch && startMatch[2]) {
    result.startTime = parseInt(startMatch[2], 10);
  }
  
  // Look for end=XX parameter (seconds)
  const endMatch = url.match(/[?&]end=(\d+)/);
  if (endMatch && endMatch[1]) {
    result.endTime = parseInt(endMatch[1], 10);
  }
  
  return result;
};

/**
 * Processes incoming deep link or shared URL
 * 
 * @param url The URL to process
 * @returns Object with extracted information for navigation
 */
export const processDeepLink = (url: string): {
  videoId: string | null;
  startTime?: number;
  endTime?: number;
} => {
  const videoId = extractYouTubeVideoId(url);
  const timestamps = extractYouTubeTimestamps(url);
  
  return {
    videoId,
    ...timestamps
  };
};
