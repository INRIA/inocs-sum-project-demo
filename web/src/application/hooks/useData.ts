/**
 * Application: generic data-fetch hook with loading / error states.
 * Wraps any async loader function; results are stable across re-renders
 * because the infrastructure layer caches responses.
 */

import { useState, useEffect } from "react";

export interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useData<T>(loader: () => Promise<T>): UseDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    loader()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loader]);

  return { data, loading, error };
}
