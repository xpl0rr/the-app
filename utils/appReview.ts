import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const MIN_LAUNCHES_UNTIL_REQUEST = 5;
const MIN_DAYS_UNTIL_REQUEST = 3;
const NEVER_ASK_AGAIN_VALUE = 'never';
const STORAGE_KEY = '@LooperApp:reviewRequested';

/**
 * Checks if conditions are right to request an app review
 * - App must be launched at least MIN_LAUNCHES_UNTIL_REQUEST times
 * - At least MIN_DAYS_UNTIL_REQUEST days must have passed since first launch
 * - User hasn't selected "never ask again"
 */
export async function shouldRequestReview(): Promise<boolean> {
  try {
    // Check if user opted out of reviews
    const reviewData = await AsyncStorage.getItem(STORAGE_KEY);
    if (reviewData === NEVER_ASK_AGAIN_VALUE) {
      return false;
    }

    const data = reviewData ? JSON.parse(reviewData) : { launches: 0, firstLaunchDate: Date.now() };
    
    // Increment launch count
    data.launches += 1;
    
    // Check conditions
    const daysSinceFirstLaunch = (Date.now() - data.firstLaunchDate) / (1000 * 60 * 60 * 24);
    const shouldRequest = 
      data.launches >= MIN_LAUNCHES_UNTIL_REQUEST && 
      daysSinceFirstLaunch >= MIN_DAYS_UNTIL_REQUEST &&
      !data.lastRequested;
    
    // Save updated data
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    return shouldRequest;
  } catch (error) {
    console.error('Error checking if should request review:', error);
    return false;
  }
}

/**
 * Records that a review request was made
 */
export async function markReviewRequested(): Promise<void> {
  try {
    const reviewData = await AsyncStorage.getItem(STORAGE_KEY);
    const data = reviewData ? JSON.parse(reviewData) : { launches: 0, firstLaunchDate: Date.now() };
    
    data.lastRequested = Date.now();
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error marking review as requested:', error);
  }
}

/**
 * Marks that the user never wants to be asked for a review again
 */
export async function markNeverAskAgain(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, NEVER_ASK_AGAIN_VALUE);
  } catch (error) {
    console.error('Error marking never ask again:', error);
  }
}

/**
 * Requests an app review if conditions are met
 */
export async function requestReviewIfAppropriate(): Promise<void> {
  try {
    const shouldRequest = await shouldRequestReview();
    
    if (shouldRequest && await StoreReview.hasAction()) {
      await StoreReview.requestReview();
      await markReviewRequested();
    }
  } catch (error) {
    console.error('Error requesting review:', error);
  }
}
