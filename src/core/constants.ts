export const IGNORED_PATHS = ['/.well-known'] as const;

export const DEFAULT_DASHBOARD_PATH = '/telescope';

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

export const REDACTED = '[REDACTED]';

export const IGNORED_STATIC_EXTENSIONS = [
  '.js',
  '.css',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.ico',
  '.map',
  '.html',
  '.xml',
  '.json',
  '.txt',
  '.md',
  '.csv',
  '.xls',
  '.xlsx',
  '.pdf',
  '.doc',
  '.docx',
] as const;

/** Reported to MCP clients as `serverInfo.version`. Pinned to package.json by a test. */
export const TELESCOPE_VERSION = '1.2.0';
