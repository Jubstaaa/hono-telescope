import type { Collector } from '../core/collectors/collector.js';
import type { ContextStrategy } from '../core/context/context-strategy.js';
import type { StorageAdapter } from '../core/storage/storage-adapter.js';

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
