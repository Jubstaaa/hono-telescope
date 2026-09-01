import type { ResolvedConfig, TelescopeConfig } from '../types/index.js';
import {
  DEFAULT_DASHBOARD_PATH,
  DEFAULT_MAX_BODY_SIZE,
  DEFAULT_REDACT_BODY_KEYS,
  DEFAULT_REDACT_HEADERS,
  IGNORED_PATHS,
} from './constants.js';
import { memoryStorage } from './storage/memory-storage.js';
import { alsContext } from './context/als-context.js';

function normalisePath(path: string): string {
  const withLeading = path.startsWith('/') ? path : `/${path}`;
  return withLeading.length > 1 ? withLeading.replace(/\/+$/, '') : withLeading;
}

export function resolveConfig(config: TelescopeConfig = {}): ResolvedConfig {
  const dashboardPath = normalisePath(config.dashboardPath ?? DEFAULT_DASHBOARD_PATH);

  return {
    enabled: config.enabled ?? process.env.NODE_ENV !== 'production',
    storage: config.storage ?? memoryStorage(),
    context: config.context ?? alsContext(),
    dashboardPath,
    ignorePaths: [...(config.ignorePaths ?? IGNORED_PATHS), dashboardPath],
    ignoreStaticAssets: config.ignoreStaticAssets ?? true,
    capture: {
      requestBody: config.capture?.requestBody ?? true,
      responseBody: config.capture?.responseBody ?? true,
      maxBodySize: config.capture?.maxBodySize ?? DEFAULT_MAX_BODY_SIZE,
    },
    redact: {
      headers: config.redact?.headers ?? [...DEFAULT_REDACT_HEADERS],
      bodyKeys: config.redact?.bodyKeys ?? [...DEFAULT_REDACT_BODY_KEYS],
    },
    dashboard: {
      auth: config.dashboard?.auth,
    },
  };
}
