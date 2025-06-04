/**
 * Test helper functions for unit testing
 */

/**
 * Mocks AsyncStorage for testing
 */
export const mockAsyncStorage = () => {
  const asyncStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    getAllKeys: jest.fn(),
    multiGet: jest.fn(),
    multiSet: jest.fn(),
    multiRemove: jest.fn(),
  };

  return asyncStorageMock;
};

/**
 * Create a mock YouTube video object for testing
 */
export const createMockYoutubeVideo = (id: string, title: string) => {
  return {
    id: { videoId: id },
    snippet: {
      title: title,
      description: `Test description for ${title}`,
      thumbnails: {
        default: { url: `https://example.com/thumb_${id}.jpg` },
        medium: { url: `https://example.com/thumb_medium_${id}.jpg` },
        high: { url: `https://example.com/thumb_high_${id}.jpg` }
      }
    }
  };
};

/**
 * Creates mock saved clips data for testing
 */
export const createMockSavedClips = (count: number = 3) => {
  const clips = [];
  
  for (let i = 0; i < count; i++) {
    clips.push({
      id: `clip_${Date.now() + i}`,
      title: `Test Clip ${i + 1}`,
      videoId: `video${i}`,
      originalVideoTitle: `Original Video ${i + 1}`,
      thumbnailUrl: `https://example.com/thumb_video${i}.jpg`,
      startTime: i * 10,
      endTime: (i * 10) + 30,
      isClip: true,
      savedAt: Date.now() - (i * 86400000) // Days ago
    });
  }
  
  return clips;
};
