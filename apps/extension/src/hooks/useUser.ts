import { useState, useEffect, useCallback } from 'react';
import { ApiService } from '@/services/api';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  profile_picture_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface UserProfileUpdate {
  full_name?: string | null;
  profile_picture_url?: string | null;
}

interface UseUserState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  updating: boolean;
}

const USER_CACHE_KEY = 'cached_user_profile';
const USER_CACHE_TIMESTAMP_KEY = 'cached_user_timestamp';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export function useUser() {
  const [state, setState] = useState<UseUserState>({
    user: null,
    loading: false,
    error: null,
    updating: false,
  });

  /**
   * Get cached user data from Chrome storage
   */
  const getCachedUser = useCallback(async (): Promise<UserProfile | null> => {
    return new Promise((resolve) => {
      chrome.storage.local.get([USER_CACHE_KEY, USER_CACHE_TIMESTAMP_KEY], (result) => {
        const cachedUser = result[USER_CACHE_KEY];
        const cacheTimestamp = result[USER_CACHE_TIMESTAMP_KEY];

        if (cachedUser && cacheTimestamp) {
          const now = Date.now();
          const cacheAge = now - cacheTimestamp;
          
          // Return cached data if it's within the cache duration
          if (cacheAge < CACHE_DURATION_MS) {
            resolve(cachedUser as UserProfile);
            return;
          }
        }
        
        resolve(null);
      });
    });
  }, []);

  /**
   * Cache user data in Chrome storage
   */
  const cacheUser = useCallback(async (user: UserProfile): Promise<void> => {
    return new Promise((resolve) => {
      const timestamp = Date.now();
      chrome.storage.local.set({
        [USER_CACHE_KEY]: user,
        [USER_CACHE_TIMESTAMP_KEY]: timestamp,
      }, () => {
        resolve();
      });
    });
  }, []);

  /**
   * Clear user cache
   */
  const clearUserCache = useCallback(async (): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.remove([USER_CACHE_KEY, USER_CACHE_TIMESTAMP_KEY], () => {
        resolve();
      });
    });
  }, []);

  /**
   * Fetch user data from the API
   */
  const fetchUserFromAPI = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const userData = await ApiService.getUserProfile();
      await cacheUser(userData);
      return userData;
    } catch (error) {
      console.error('Failed to fetch user profile from API:', error);
      
      // If it's an authentication error, clear the cache
      if (error instanceof Error && error.message.includes('authentication')) {
        await clearUserCache();
      }
      
      throw error;
    }
  }, [cacheUser, clearUserCache]);

  /**
   * Load user data (from cache first, then API if needed)
   */
  const loadUser = useCallback(async (forceRefresh: boolean = false) => {
    // Don't load if already loading
    if (state.loading) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      let userData: UserProfile | null = null;

      // Check if user is authenticated first
      const isAuthenticated = await ApiService.isAuthenticated();
      if (!isAuthenticated) {
        setState({
          user: null,
          loading: false,
          error: null,
          updating: false,
        });
        await clearUserCache();
        return;
      }

      // Try to get cached data first (unless forcing refresh)
      if (!forceRefresh) {
        userData = await getCachedUser();
      }

      // If no cached data or forcing refresh, fetch from API
      if (!userData) {
        userData = await fetchUserFromAPI();
      }

      setState(prev => ({
        ...prev,
        user: userData,
        loading: false,
        error: null,
      }));

    } catch (error) {
      console.error('Error loading user data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load user data',
      }));
    }
  }, [state.loading, getCachedUser, fetchUserFromAPI, clearUserCache]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates: UserProfileUpdate): Promise<void> => {
    if (state.updating || !state.user) return;

    setState(prev => ({ ...prev, updating: true, error: null }));

    try {
      const updatedUser = await ApiService.updateUserProfile(updates);
      
      // Update cache
      await cacheUser(updatedUser);
      
      setState(prev => ({
        ...prev,
        user: updatedUser,
        updating: false,
        error: null,
      }));

    } catch (error) {
      console.error('Error updating user profile:', error);
      setState(prev => ({
        ...prev,
        updating: false,
        error: error instanceof Error ? error.message : 'Failed to update profile',
      }));
      throw error; // Re-throw so calling component can handle
    }
  }, [state.updating, state.user, cacheUser]);

  /**
   * Refresh user data from API
   */
  const refreshUser = useCallback(() => {
    return loadUser(true);
  }, [loadUser]);

  /**
   * Clear user data (on logout)
   */
  const clearUser = useCallback(async () => {
    setState({
      user: null,
      loading: false,
      error: null,
      updating: false,
    });
    await clearUserCache();
  }, [clearUserCache]);

  // Load user data on hook initialization
  useEffect(() => {
    loadUser();
  }, []); // Only run once on mount

  return {
    // State
    user: state.user,
    loading: state.loading,
    error: state.error,
    updating: state.updating,
    
    // Actions
    loadUser,
    updateProfile,
    refreshUser,
    clearUser,
    
    // Computed values
    isAuthenticated: !!state.user,
    displayName: state.user?.full_name || state.user?.email || 'User',
  };
}