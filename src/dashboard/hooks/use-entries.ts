import { useCallback, useEffect, useState } from 'react';
import type { DashboardStats } from '@/types';

declare global {
  interface Window {
    __TELESCOPE_BASE__?: string;
  }
}

const base = (): string => window.__TELESCOPE_BASE__ ?? '/telescope';

const REFRESH_EVENT = 'telescope:refresh';

export function refreshAllEntries(): void {
  window.dispatchEvent(new Event(REFRESH_EVENT));
}

interface Result<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | undefined;
  refetch: () => void;
}

function useJson<T>(path: string | null): Result<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(path !== null);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    window.addEventListener(REFRESH_EVENT, refetch);
    return () => window.removeEventListener(REFRESH_EVENT, refetch);
  }, [refetch]);

  useEffect(() => {
    if (path === null) return;

    let cancelled = false;
    const controller = new AbortController();

    setIsLoading(true);
    setError(undefined);

    fetch(`${base()}/api/${path}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Request failed with ${response.status}`);
        return (await response.json()) as T;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((cause: unknown) => {
        if (!cancelled && !controller.signal.aborted) {
          setError(cause instanceof Error ? cause : new Error(String(cause)));
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [path, tick]);

  return { data, isLoading, error, refetch };
}

interface ListResult<T> extends Omit<Result<T[]>, 'data'> {
  data: T[];
}

export function useList<T>(resource: string): ListResult<T> {
  const result = useJson<T[]>(resource);
  return { ...result, data: result.data ?? [] };
}

export function useDetail<T>(resource: string, id: string | undefined): Result<T> {
  return useJson<T>(id ? `${resource}/${id}` : null);
}

export function useStats(): Result<DashboardStats> {
  return useJson<DashboardStats>('stats');
}

export function useClearData(): { clearData: () => Promise<void>; isLoading: boolean } {
  const [isLoading, setIsLoading] = useState(false);

  const clearData = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetch(`${base()}/api/clear`, { method: 'POST' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { clearData, isLoading };
}
