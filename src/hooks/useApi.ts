/**
 * Custom hooks for data fetching with loading, error states, and smart caching
 * React Native version of the web frontend's useApi hooks
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { API_CONFIG } from "../config/constants";

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isValidating: boolean;
  refetch: () => Promise<void>;
}

export interface UseApiOptions {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  cacheDuration?: number;
  staleTime?: number;
}

/**
 * Basic API fetching hook without caching
 */
export function useApi<T>(
  fetchFn: () => Promise<T>,
  dependencies: unknown[] = [],
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isValidating = false;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { data, loading, error, isValidating, refetch: fetchData };
}

// =============================================================================
// CACHE MANAGEMENT
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

const cache = new Map<string, CacheEntry<unknown>>();
const pendingRequests = new Map<string, Promise<unknown>>();

export function getCachedData<T>(
  key: string,
  cacheDuration: number = API_CONFIG.CACHE_DURATION,
): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cacheDuration) {
    return cached.data as T;
  }
  return null;
}

export function isCacheStale(
  key: string,
  staleTime: number = API_CONFIG.STALE_TIME,
): boolean {
  const cached = cache.get(key);
  if (!cached) return true;
  return Date.now() - cached.timestamp > staleTime;
}

export function setCachedData<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now(), isStale: false });
}

export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

export function invalidateCache(key: string): void {
  const cached = cache.get(key);
  if (cached) {
    cached.isStale = true;
  }
}

// =============================================================================
// ENHANCED HOOK WITH CACHING
// =============================================================================

export function useApiWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  dependencies: unknown[] = [],
  options: UseApiOptions = {},
): UseApiState<T> {
  const {
    revalidateOnFocus = true,
    cacheDuration = API_CONFIG.CACHE_DURATION,
    staleTime = API_CONFIG.STALE_TIME,
  } = options;

  const [data, setData] = useState<T | null>(() =>
    getCachedData<T>(key, cacheDuration),
  );
  const [loading, setLoading] = useState<boolean>(!data);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const mountedRef = useRef(true);

  const fetchData = useCallback(
    async (isBackground = false) => {
      const pending = pendingRequests.get(key);
      if (pending) {
        try {
          const result = (await pending) as T;
          if (mountedRef.current) {
            setData(result);
            setLoading(false);
            setIsValidating(false);
          }
          return;
        } catch {
          // Let it continue to make a new request
        }
      }

      try {
        if (isBackground) {
          setIsValidating(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const promise = fetchFn();
        pendingRequests.set(key, promise);

        const result = await promise;

        if (mountedRef.current) {
          setData(result);
          setCachedData(key, result);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : "An error occurred");
          console.error("API Error:", err);
        }
      } finally {
        pendingRequests.delete(key);
        if (mountedRef.current) {
          setLoading(false);
          setIsValidating(false);
        }
      }
    },
    [key, fetchFn],
  );

  const revalidateIfStale = useCallback(() => {
    if (isCacheStale(key, staleTime)) {
      fetchData(true);
    }
  }, [key, staleTime, fetchData]);

  // Initial fetch or use cache
  useEffect(() => {
    const cached = getCachedData<T>(key, cacheDuration);
    if (cached) {
      setData(cached);
      setLoading(false);
      if (isCacheStale(key, staleTime)) {
        fetchData(true);
      }
    } else {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ...dependencies]);

  // Revalidate on app focus (equivalent to window focus in web)
  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        revalidateIfStale();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, [revalidateOnFocus, revalidateIfStale]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    isValidating,
    refetch: () => fetchData(false),
  };
}
