import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { DashboardStats } from '@/core/hono/dashboard-api';

import { DASHBOARD_BASE } from '../base-path';

const ROOT_KEY = 'telescope';

async function fetchJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${DASHBOARD_BASE()}/api/${path}`, { signal });
  if (!response.ok) throw new Error(`Request failed with ${response.status}`);

  return (await response.json()) as T;
}

interface Result<T> {
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  refetch: () => void;
}

function useJson<T>(path: string | undefined): Result<T> {
  const query = useQuery({
    enabled: path !== undefined,
    queryFn: ({ signal }) => fetchJson<T>(path ?? '', signal),
    queryKey: [ROOT_KEY, path],
  });

  return {
    data: query.data,
    error: query.error ?? undefined,
    isLoading: query.isLoading,
    isRefreshing: query.isFetching,
    refetch: () => void query.refetch(),
  };
}

/** Refetches every query on screen; live mode calls it on an interval. */
export function useRefreshAll(): () => void {
  const client = useQueryClient();

  return () => void client.invalidateQueries({ queryKey: [ROOT_KEY] });
}

export function useList<T>(resource: string): Omit<Result<T[]>, 'data'> & { data: T[] } {
  const result = useJson<T[]>(resource);

  return { ...result, data: result.data ?? [] };
}

export function useDetail<T>(resource: string, id: string | undefined): Result<T> {
  return useJson<T>(id ? `${resource}/${id}` : undefined);
}

export function useStats(): Result<DashboardStats> {
  return useJson<DashboardStats>('stats');
}

export function useClearData(): { clearData: () => Promise<void>; isLoading: boolean } {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${DASHBOARD_BASE()}/api/clear`, { method: 'POST' });
      if (!response.ok) throw new Error(`Request failed with ${response.status}`);
    },
    onSuccess: () => client.resetQueries({ queryKey: [ROOT_KEY] }),
  });

  return { clearData: mutation.mutateAsync, isLoading: mutation.isPending };
}
