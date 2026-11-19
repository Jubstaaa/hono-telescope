export { createTelescope } from './core/create-telescope.js';
export type { Telescope } from './core/create-telescope.js';

export { memoryStorage } from './core/storage/memory-storage.js';
export type { MemoryStorageOptions } from './core/storage/memory-storage.js';
export type { StorageAdapter, ListOptions } from './core/storage/storage-adapter.js';

export { alsContext } from './core/context/als-context.js';
export type { ContextStrategy, RequestContext } from './core/context/context-strategy.js';

export { Recorder } from './core/recorder.js';

export type { Collector } from './core/collectors/collector.js';
export { consoleCollector } from './core/collectors/console-collector.js';
export { exceptionCollector } from './core/collectors/exception-collector.js';
export { fetchCollector } from './core/collectors/fetch-collector.js';

export { ExceptionClass, LogLevel } from './core/entries.js';
export type {
  BaseEntry,
  CreateInputMap,
  EntryMap,
  EntryType,
  ExceptionCreateInput,
  ExceptionEntry,
  ExceptionEntryData,
  IncomingRequestCreateInput,
  IncomingRequestEntry,
  IncomingRequestEntryData,
  LogCreateInput,
  LogEntry,
  LogEntryData,
  OutgoingRequestCreateInput,
  OutgoingRequestEntry,
  OutgoingRequestEntryData,
  QueryCreateInput,
  QueryEntry,
  QueryEntryData,
  TelescopeCreateInput,
  TelescopeEntry,
} from './core/entries.js';

export type {
  DashboardStats,
  ExceptionDetailResponse,
  ExceptionResponse,
  IncomingRequestDetailResponse,
  IncomingRequestResponse,
  LogDetailResponse,
  LogResponse,
  OutgoingRequestDetailResponse,
  OutgoingRequestResponse,
  QueryDetailResponse,
  QueryResponse,
  TelescopeDetailResponse,
  TelescopeListResponse,
} from './core/hono/dashboard-api.js';

export type {
  CaptureConfig,
  DashboardAuth,
  DashboardConfig,
  RedactConfig,
  ResolvedConfig,
  TelescopeConfig,
} from './core/config.js';
