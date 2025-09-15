import { useState, useEffect, useCallback } from "react";
import { ApiService, UserPreferencesData } from "../services/api";

export interface UsePreferencesReturn {
  preferences: UserPreferencesData | null;
  loading: boolean;
  error: string | null;
  updating: boolean;
  refreshPreferences: () => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferencesData>) => Promise<void>;
}

export function usePreferences(): UsePreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferencesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const refreshPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userPreferences = await ApiService.getUserPreferences();
      setPreferences(userPreferences);
    } catch (err) {
      console.error("Failed to load preferences:", err);
      setError(err instanceof Error ? err.message : "Failed to load preferences");
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferencesData>) => {
    try {
      setUpdating(true);
      setError(null);
      const updatedPreferences = await ApiService.updateUserPreferences(updates);
      setPreferences(updatedPreferences);
    } catch (err) {
      console.error("Failed to update preferences:", err);
      setError(err instanceof Error ? err.message : "Failed to update preferences");
      throw err; // Re-throw to let the UI handle the error
    } finally {
      setUpdating(false);
    }
  }, []);

  useEffect(() => {
    refreshPreferences();
  }, [refreshPreferences]);

  return {
    preferences,
    loading,
    error,
    updating,
    refreshPreferences,
    updatePreferences,
  };
}