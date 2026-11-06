"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Minimal loader for page-local data fetched from the service layer.
 * Pass a stable function (a service function or a memoised callback).
 */
export function useAsync<T>(fn: () => Promise<T>) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const result = await fn();
    setData(result);
    setLoading(false);
  }, [fn]);

  useEffect(() => {
    let cancelled = false;
    fn().then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fn]);

  return { data, setData, loading, reload };
}
