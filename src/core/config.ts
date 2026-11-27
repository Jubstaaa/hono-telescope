import type { Collector } from './collectors/collector.js'
import type { ContextStrategy } from './context/context-strategy.js'
import type { StorageAdapter } from './storage/storage-adapter.js'

import { alsContext } from './context/als-context.js'
import { memoryStorage } from './storage/memory-storage.js'

const IGNORED_PATHS = ['/.well-known'] as const

const DEFAULT_DASHBOARD_PATH = '/telescope'

export const DEFAULT_MAX_BODY_SIZE = 65536

export const DEFAULT_REDACT_HEADERS = [
    'authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
    'proxy-authorization',
] as const

export const DEFAULT_REDACT_BODY_KEYS = [
    'password',
    'token',
    'secret',
    'apikey',
    'authorization',
] as const

export interface CaptureConfig {
    maxBodySize: number
    requestBody: boolean
    responseBody: boolean
}

export interface DashboardAuth {
    password: string
    username: string
}

export interface DashboardConfig {
    auth?: DashboardAuth | false | undefined
}

export interface RedactConfig {
    bodyKeys: string[]
    headers: string[]
}

export interface ResolvedConfig {
    capture: CaptureConfig
    context: ContextStrategy
    dashboard: DashboardConfig
    dashboardPath: string
    enabled: boolean
    ignorePaths: string[]
    ignoreStaticAssets: boolean
    redact: RedactConfig
    storage: StorageAdapter
}

export interface TelescopeConfig {
    capture?: Partial<CaptureConfig> | undefined
    collectors?: Collector[] | undefined
    context?: ContextStrategy | undefined
    dashboard?: Partial<DashboardConfig> | undefined
    dashboardPath?: string | undefined
    enabled?: boolean | undefined
    ignorePaths?: string[] | undefined
    ignoreStaticAssets?: boolean | undefined
    redact?: Partial<RedactConfig> | undefined
    storage?: StorageAdapter | undefined
}

export function resolveConfig(config: TelescopeConfig = {}): ResolvedConfig {
    const dashboardPath = normalisePath(
        config.dashboardPath ?? DEFAULT_DASHBOARD_PATH
    )

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
    }
}

function normalisePath(path: string): string {
    const withLeading = path.startsWith('/') ? path : `/${path}`
    return withLeading.length > 1
        ? withLeading.replace(/\/+$/, '')
        : withLeading
}
