import { useState, useEffect, useCallback } from "react";
import { ApiService, CreditStatus } from "@/services/api";

interface UseCreditReturn {
  creditStatus: CreditStatus | null;
  loading: boolean;
  error: string | null;
  refreshCredits: () => Promise<void>;
  updateCreditsFromStream: (credits_remaining?: number, is_low_credits?: boolean, credits_exhausted?: boolean) => void;
}

export function useCredits(): UseCreditReturn {
  const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCredits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await ApiService.getUserCredits();
      setCreditStatus(status);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get credit status";
      setError(errorMessage);
      console.error("Error fetching credit status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCreditsFromStream = useCallback((
    credits_remaining?: number,
    is_low_credits?: boolean,
    credits_exhausted?: boolean
  ) => {
    if (credits_remaining !== undefined) {
      setCreditStatus(prev => prev ? {
        ...prev,
        credits_remaining,
        is_low_credits: is_low_credits ?? prev.is_low_credits,
        credits_exhausted: credits_exhausted ?? prev.credits_exhausted
      } : null);
    }
  }, []);

  // Load credits on mount and when user signs in
  useEffect(() => {
    const loadCredits = async () => {
      try {
        const isAuth = await ApiService.isAuthenticated();
        if (isAuth) {
          refreshCredits();
        }
      } catch (err) {
        // Ignore auth check errors
      }
    };

    loadCredits();
  }, [refreshCredits]);

  return {
    creditStatus,
    loading,
    error,
    refreshCredits,
    updateCreditsFromStream
  };
}