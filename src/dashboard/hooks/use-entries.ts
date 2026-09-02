import { useCallback, useEffect, useState } from 'react';

import type { DashboardStats } from '@/types';

import { DASHBOARD_BASE } from '../config';

const REFRESH_EVENT = 'telescope:refresh';

export function refreshAllEntries(): void {
  window.dispatchEvent(new Event(REFRESH_EVENT));
}

interface Result<T> {
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
  refetch: () => void;
}

interface Settled<T> {
  data?: T;
  error?: Error;
  path: string;
  tick: number;
}

function useJson<T>(path: string | null): Result<T> {
  const [settled, setSettled] = useState<Settled<T> | undefined>(undefined);
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

    fetch(`${DASHBOARD_BASE()}/api/${path}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Request failed with ${response.status}`);
        return (await response.json()) as T;
      })
      .then((json) => {
        if (!cancelled) setSettled({ data: json, path, tick });
      })
      .catch((cause: unknown) => {
        if (!cancelled && !controller.signal.aborted) {
          setSettled({
            error: cause instanceof Error ? cause : new Error(String(cause)),
            path,
            tick,
          });
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [path, tick]);

  // Loading is derived, not stored: setting it synchronously inside the effect caused
  // cascading renders. The previous payload is kept across a refetch of the same path so live
  // mode does not blank the table every second, and dropped when the path changes so one
  // resource's rows never render under another resource's view.
  const samePath = settled !== undefined && settled.path === path;

  return {
    data: samePath ? settled.data : undefined,
    error: samePath && settled.tick === tick ? settled.error : undefined,
    isLoading: path !== null && !(samePath && settled.tick === tick),
    refetch,
  };
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
      const response = await fetch(`${DASHBOARD_BASE()}/api/clear`, { method: 'POST' });
      if (!response.ok) throw new Error(`Request failed with ${response.status}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { clearData, isLoading };
}
