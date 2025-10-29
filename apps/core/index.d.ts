import { TelescopeConfig } from '@hono-telescope/types';
import type { Hono } from 'hono';
export declare function setupTelescope(app: Hono, config?: Partial<TelescopeConfig>): Hono;
