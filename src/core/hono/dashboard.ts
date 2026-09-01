import { Hono } from 'hono';
import { basicAuth } from 'hono/basic-auth';
import type { EntryType, ResolvedConfig } from '../../types/index.js';
import type { Recorder } from '../recorder.js';
import {
  mapException,
  mapIncomingRequest,
  mapLog,
  mapOutgoingRequest,
  mapQuery,
} from '../utils/mappers.js';
import { DASHBOARD_ASSETS, DASHBOARD_HTML } from './dashboard-assets.js';

const RESOURCES: Record<string, EntryType> = {
  'incoming-requests': 'incoming_request',
  'outgoing-requests': 'outgoing_request',
  exceptions: 'exception',
  logs: 'log',
  queries: 'query',
};

const MAPPERS = {
  incoming_request: mapIncomingRequest,
  outgoing_request: mapOutgoingRequest,
  exception: mapException,
  log: mapLog,
  query: mapQuery,
} as const;

function renderHtml(basePath: string): string {
  const script = `<script>window.__TELESCOPE_BASE__=${JSON.stringify(basePath).replace(/</g, '\\u003C')};</script>`;
  const withBase = DASHBOARD_HTML.replace(
    /(src|href)=["']\.?\/?assets\//g,
    `$1="${basePath}/assets/`
  );

  return withBase.includes('</head>')
    ? withBase.replace('</head>', `${script}</head>`)
    : `${script}${withBase}`;
}

export function createDashboard(recorder: Recorder, config: ResolvedConfig): Hono {
  if (
    config.enabled &&
    process.env.NODE_ENV === 'production' &&
    config.dashboard.auth === undefined
  ) {
    throw new Error(
      'hono-telescope: refusing to expose the dashboard in production without credentials. ' +
        'Set `enabled: false`, or provide `dashboard.auth: { username, password }`.'
    );
  }

  const app = new Hono();
  const html = renderHtml(config.dashboardPath);

  if (config.dashboard.auth) {
    app.use('*', basicAuth(config.dashboard.auth));
  }

  app.get('/assets/:file', (c) => {
    const asset = DASHBOARD_ASSETS[c.req.param('file')];
    if (!asset) return c.json({ error: 'Not found' }, 404);

    c.header('Content-Type', asset.contentType);
    return c.body(asset.body);
  });

  app.get('/api/stats', async (c) => {
    const [incomingRequests, outgoingRequests, exceptions, queries, logs] = await Promise.all([
      recorder.count('incoming_request'),
      recorder.count('outgoing_request'),
      recorder.count('exception'),
      recorder.count('query'),
      recorder.count('log'),
    ]);

    return c.json({
      incomingRequests: { total: incomingRequests },
      outgoingRequests: { total: outgoingRequests },
      exceptions: { total: exceptions },
      queries: { total: queries },
      logs: { total: logs },
    });
  });

  app.post('/api/clear', async (c) => {
    await recorder.clear();
    return c.json({ success: true, message: 'All data cleared successfully' });
  });

  app.get('/api/:resource', async (c) => {
    const type = RESOURCES[c.req.param('resource')];
    if (!type) return c.json({ error: 'Not found' }, 404);

    const entries = await recorder.list(type);
    const map = MAPPERS[type] as (entry: unknown) => unknown;

    return c.json(entries.map(map));
  });

  app.get('/api/:resource/:id', async (c) => {
    const type = RESOURCES[c.req.param('resource')];
    if (!type) return c.json({ error: 'Not found' }, 404);

    const entry = await recorder.find(type, c.req.param('id'));
    if (!entry) return c.json({ error: 'Not found' }, 404);

    if (type !== 'incoming_request') return c.json(entry);

    const [logs, queries, exceptions, outgoingRequests] = await Promise.all([
      recorder.findByParent('log', entry.id),
      recorder.findByParent('query', entry.id),
      recorder.findByParent('exception', entry.id),
      recorder.findByParent('outgoing_request', entry.id),
    ]);

    return c.json({
      ...entry,
      relation_entries: {
        logs: logs.map(mapLog),
        queries: queries.map(mapQuery),
        exceptions: exceptions.map(mapException),
        outgoing_requests: outgoingRequests.map(mapOutgoingRequest),
      },
    });
  });

  app.get('/*', (c) => c.html(html));

  return app;
}
