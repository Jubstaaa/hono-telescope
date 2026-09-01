export { createTelescope } from './core/create-telescope';
export type { Telescope } from './core/create-telescope';

export { memoryStorage } from './core/storage/memory-storage';
export type { MemoryStorageOptions } from './core/storage/memory-storage';
export type { StorageAdapter, ListOptions } from './core/storage/storage-adapter';

export { alsContext } from './core/context/als-context';
export type { ContextStrategy, RequestContext } from './core/context/context-strategy';

export { Recorder } from './core/recorder';

export type { Collector } from './core/collectors/collector';
export { consoleCollector } from './core/collectors/console-collector';
export { exceptionCollector } from './core/collectors/exception-collector';
export { fetchCollector } from './core/collectors/fetch-collector';

export * from './types/index';
