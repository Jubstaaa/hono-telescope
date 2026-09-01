import type { StorageAdapter } from '../core/storage/storage-adapter.js';
import type { ContextStrategy } from '../core/context/context-strategy.js';
import type { Collector } from '../core/collectors/collector.js';

export interface CaptureConfig {
  requestBody: boolean;
  responseBody: boolean;
  maxBodySize: number;
}

export interface RedactConfig {
  headers: string[];
  bodyKeys: string[];
}

export interface DashboardAuth {
  username: string;
  password: string;
}

export interface DashboardConfig {
  // `undefined` means "not configured" and is what the production guard rejects;
  // an explicit `false` is the documented opt-out and passes the guard.
  auth?: DashboardAuth | false;
}

export interface ResolvedConfig {
  enabled: boolean;
  storage: StorageAdapter;
  context: ContextStrategy;
  dashboardPath: string;
  ignorePaths: string[];
  ignoreStaticAssets: boolean;
  capture: CaptureConfig;
  redact: RedactConfig;
  dashboard: DashboardConfig;
}

export interface TelescopeConfig {
  enabled?: boolean;
  storage?: StorageAdapter;
  context?: ContextStrategy;
  collectors?: Collector[];
  dashboardPath?: string;
  ignorePaths?: string[];
  ignoreStaticAssets?: boolean;
  capture?: Partial<CaptureConfig>;
  redact?: Partial<RedactConfig>;
  dashboard?: Partial<DashboardConfig>;
}
