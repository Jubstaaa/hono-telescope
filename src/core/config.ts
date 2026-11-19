import type { Collector } from './collectors/collector.js';
import { alsContext } from './context/als-context.js';
import type { ContextStrategy } from './context/context-strategy.js';
import { memoryStorage } from './storage/memory-storage.js';
import type { StorageAdapter } from './storage/storage-adapter.js';

const IGNORED_PATHS = ['/.well-known'] as const;

const DEFAULT_DASHBOARD_PATH = '/telescope';

export const DEFAULT_MAX_BODY_SIZE = 65536;

export const DEFAULT_REDACT_HEADERS = [
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'proxy-authorization',
] as const;

export const DEFAULT_REDACT_BODY_KEYS = [
  'password',
  'token',
  'secret',
  'apikey',
  'authorization',
] as const;

export interface CaptureConfig {
  maxBodySize: number;
  requestBody: boolean;
  responseBody: boolean;
}

export interface RedactConfig {
  bodyKeys: string[];
  headers: string[];
}

export interface DashboardAuth {
  password: string;
  username: string;
}

export interface DashboardConfig {
  // `undefined` means "not configured" and is what the production guard rejects;
  // an explicit `false` is the documented opt-out and passes the guard.
  auth?: DashboardAuth | false;
}

export interface ResolvedConfig {
  capture: CaptureConfig;
  context: ContextStrategy;
  dashboard: DashboardConfig;
  dashboardPath: string;
  enabled: boolean;
  ignorePaths: string[];
  ignoreStaticAssets: boolean;
  redact: RedactConfig;
  storage: StorageAdapter;
}

export interface TelescopeConfig {
  capture?: Partial<CaptureConfig>;
  collectors?: Collector[];
  context?: ContextStrategy;
  dashboard?: Partial<DashboardConfig>;
  dashboardPath?: string;
  enabled?: boolean;
  ignorePaths?: string[];
  ignoreStaticAssets?: boolean;
  redact?: Partial<RedactConfig>;
  storage?: StorageAdapter;
}

function normalisePath(path: string): string {
  const withLeading = path.startsWith('/') ? path : `/${path}`;
  return withLeading.length > 1 ? withLeading.replace(/\/+$/, '') : withLeading;
}

export function resolveConfig(config: TelescopeConfig = {}): ResolvedConfig {
  const dashboardPath = normalisePath(config.dashboardPath ?? DEFAULT_DASHBOARD_PATH);

  return {
    capture: {
      maxBodySize: config.capture?.maxBodySize ?? DEFAULT_MAX_BODY_SIZE,
      requestBody: config.capture?.requestBody ?? true,
      responseBody: config.capture?.responseBody ?? true,
    },
    context: config.context ?? alsContext(),
    dashboard: {
      auth: config.dashboard?.auth,
    },
    dashboardPath,
    enabled: config.enabled ?? process.env.NODE_ENV !== 'production',
    ignorePaths: [...(config.ignorePaths ?? IGNORED_PATHS), dashboardPath],
    ignoreStaticAssets: config.ignoreStaticAssets ?? true,
    redact: {
      bodyKeys: config.redact?.bodyKeys ?? [...DEFAULT_REDACT_BODY_KEYS],
      headers: config.redact?.headers ?? [...DEFAULT_REDACT_HEADERS],
    },
    storage: config.storage ?? memoryStorage(),
  };
}
