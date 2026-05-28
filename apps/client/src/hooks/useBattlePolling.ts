import { useEffect, useRef, useState } from "react";

import { getBattleState } from "../api";
import type { BattleState } from "../types/game";

export function useBattlePolling() {
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    const loadBattleState = async () => {
      if (inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;

      try {
        const nextState = await getBattleState();
        if (!mountedRef.current) {
          return;
        }

        setBattleState(nextState);
        setError(null);
        setLastUpdatedAt(new Date().toISOString());
      } catch (requestError) {
        if (!mountedRef.current) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load battle state.",
        );
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }

        inFlightRef.current = false;
      }
    };

    void loadBattleState();

    const intervalId = window.setInterval(() => {
      void loadBattleState();
    }, 2000);

    return () => {
      mountedRef.current = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const refresh = async () => {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;

    try {
      const nextState = await getBattleState();
      if (!mountedRef.current) {
        return;
      }

      setBattleState(nextState);
      setError(null);
      setLastUpdatedAt(new Date().toISOString());
    } catch (requestError) {
      if (!mountedRef.current) {
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load battle state.",
      );
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }

      inFlightRef.current = false;
    }
  };

  return {
    battleState,
    isLoading,
    error,
    lastUpdatedAt,
    refresh,
  };
}
