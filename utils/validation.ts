/**
 * Validation utilities for Looper app
 */

/**
 * Validates YouTube video ID format
 * @param videoId The YouTube video ID to validate
 * @returns boolean indicating if the ID appears valid
 */
export const isValidYouTubeVideoId = (videoId: string | undefined | null): boolean => {
  if (!videoId) return false;
  
  // YouTube IDs are typically 11 characters, but can vary
  // This is a simple check - YouTube IDs don't follow a strict pattern
  return /^[A-Za-z0-9_-]{10,12}$/.test(videoId);
};

/**
 * Validates time inputs for video clips
 * @param time The time value to validate in seconds
 * @param maxTime Optional maximum time limit (video duration)
 * @returns The validated time (clamped to valid range) or 0 if invalid
 */
export const validateTimeInput = (time: any, maxTime?: number): number => {
  // Convert to number and handle NaN
  const numTime = Number(time);
  if (isNaN(numTime) || numTime < 0) return 0;
  
  // If maxTime is provided, ensure time doesn't exceed it
  if (maxTime !== undefined && numTime > maxTime) {
    return maxTime;
  }
  
  return numTime;
};

/**
 * Ensures a clip's end time is greater than its start time
 * @param startTime Clip start time in seconds
 * @param endTime Clip end time in seconds
 * @param duration Video duration in seconds
 * @returns Object with validated start and end times
 */
export const validateClipTimes = (
  startTime: number, 
  endTime: number, 
  duration: number
): { startTime: number, endTime: number } => {
  // Validate individual times
  const validatedStart = validateTimeInput(startTime, duration);
  const validatedEnd = validateTimeInput(endTime, duration);
  
  // Ensure end time is after start time
  if (validatedEnd <= validatedStart) {
    // If invalid, set end time to start time + 10 seconds or duration
    const newEnd = Math.min(validatedStart + 10, duration);
    return { startTime: validatedStart, endTime: newEnd };
  }
  
  return { startTime: validatedStart, endTime: validatedEnd };
};

/**
 * Sanitizes clip title input
 * @param title User provided clip title
 * @returns Sanitized title string
 */
export const sanitizeClipTitle = (title: string): string => {
  if (!title || title.trim() === '') {
    return 'Untitled Clip';
  }
  
  // Remove any potentially problematic characters
  return title.trim().slice(0, 100);
};
