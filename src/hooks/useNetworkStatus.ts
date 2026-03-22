import { useState, useEffect, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";

/**
 * Hook to monitor network connectivity.
 * Uses a lightweight fetch-based approach to avoid native module dependencies.
 */
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  const checkConnectivity = useCallback(async () => {
    try {
      const response = await fetch("https://dns.google/resolve?name=google.com", {
        method: "HEAD",
        cache: "no-cache",
      });
      const connected = response.ok;
      setIsConnected((prev) => {
        if (!prev && connected) setWasOffline(true);
        else if (connected) setWasOffline(false);
        return connected;
      });
    } catch {
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    checkConnectivity();

    const interval = setInterval(checkConnectivity, 10000);

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "active") checkConnectivity();
    };

    const subscription = AppState.addEventListener("change", handleAppState);

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [checkConnectivity]);

  return { isConnected, wasOffline };
}
