import type { MiddlewareHandler } from 'hono';
import { TelescopeConfig } from '@hono-telescope/types';
export declare function telescope(config?: Partial<TelescopeConfig>): MiddlewareHandler;
