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

export * from './types/index.js';
