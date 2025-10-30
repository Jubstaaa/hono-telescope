import type { Context } from 'hono';
import { TelescopeDashboard } from '../dashboard/dashboard';

type HonoContext = Context<{
  Bindings: {
    ENV: string;
  };
  Variables: {
    id: string;
  };
}>;

export class TelescopeRoutes {
  private dashboard: TelescopeDashboard;

  constructor() {
    this.dashboard = new TelescopeDashboard();
  }

  async getDashboard(c: HonoContext) {
    const html = this.dashboard.getDashboardHtml();
    return c.html(html);
  }

  async getStats(c: HonoContext) {
    try {
      const stats = await this.dashboard.getStats();
      return c.json(stats);
    } catch {
      return c.json({ error: 'Failed to fetch stats' }, 500);
    }
  }

  async getAsset(c: HonoContext) {
    const fullPath = c.req.path;
    const assetPath = fullPath.replace('/telescope', '');
    const content = this.dashboard.getAsset(assetPath);

    if (!content) {
      return c.notFound();
    }

    if (assetPath.endsWith('.js')) {
      c.header('Content-Type', 'application/javascript');
      return c.body(content);
    }
    if (assetPath.endsWith('.css')) {
      c.header('Content-Type', 'text/css');
      return c.body(content);
    }
    if (assetPath.endsWith('.svg')) {
      c.header('Content-Type', 'image/svg+xml');
      return c.body(content);
    }
    if (assetPath.endsWith('.html')) {
      return c.html(content);
    }
    if (assetPath.endsWith('.map')) {
      c.header('Content-Type', 'application/json');
      return c.body(content);
    }

    return c.html(content);
  }

  async getIncomingRequests(c: HonoContext) {
    try {
      const entries = await this.dashboard.getAllIncomingRequests();
      return c.json(entries);
    } catch {
      return c.json({ error: 'Failed to fetch incoming requests' }, 500);
    }
  }

  async getIncomingRequest(c: HonoContext) {
    const id = c.req.param('id');

    if (!id) {
      return c.json({ error: 'Request ID is required' }, 400);
    }

    try {
      const result = await this.dashboard.getIncomingRequest(id);
      if (!result) {
        return c.json({ error: 'Request not found' }, 404);
      }
      return c.json(result);
    } catch {
      return c.json({ error: 'Failed to fetch request' }, 500);
    }
  }

  async getOutgoingRequests(c: HonoContext) {
    try {
      const entries = await this.dashboard.getAllOutgoingRequests();
      return c.json(entries);
    } catch {
      return c.json({ error: 'Failed to fetch outgoing requests' }, 500);
    }
  }

  async getOutgoingRequest(c: HonoContext) {
    const id = c.req.param('id');

    if (!id) {
      return c.json({ error: 'Request ID is required' }, 400);
    }

    try {
      const entry = await this.dashboard.getOutgoingRequest(id);
      if (!entry) {
        return c.json({ error: 'Request not found' }, 404);
      }
      return c.json(entry);
    } catch {
      return c.json({ error: 'Failed to fetch request' }, 500);
    }
  }

  async getExceptions(c: HonoContext) {
    try {
      const entries = await this.dashboard.getAllExceptions();
      return c.json(entries);
    } catch {
      return c.json({ error: 'Failed to fetch exceptions' }, 500);
    }
  }

  async getException(c: HonoContext) {
    const id = c.req.param('id');

    if (!id) {
      return c.json({ error: 'Exception ID is required' }, 400);
    }

    try {
      const entry = await this.dashboard.getException(id);
      if (!entry) {
        return c.json({ error: 'Exception not found' }, 404);
      }
      return c.json(entry);
    } catch {
      return c.json({ error: 'Failed to fetch exception' }, 500);
    }
  }

  async getQueries(c: HonoContext) {
    try {
      const entries = await this.dashboard.getAllQueries();
      return c.json(entries);
    } catch {
      return c.json({ error: 'Failed to fetch queries' }, 500);
    }
  }

  async getQuery(c: HonoContext) {
    const id = c.req.param('id');

    if (!id) {
      return c.json({ error: 'Query ID is required' }, 400);
    }

    try {
      const entry = await this.dashboard.getQuery(id);
      if (!entry) {
        return c.json({ error: 'Query not found' }, 404);
      }
      return c.json(entry);
    } catch {
      return c.json({ error: 'Failed to fetch query' }, 500);
    }
  }

  async getLogs(c: HonoContext) {
    try {
      const entries = await this.dashboard.getAllLogs();
      return c.json(entries);
    } catch {
      return c.json({ error: 'Failed to fetch logs' }, 500);
    }
  }

  async getLog(c: HonoContext) {
    const id = c.req.param('id');

    if (!id) {
      return c.json({ error: 'Log ID is required' }, 400);
    }

    try {
      const entry = await this.dashboard.getLog(id);
      if (!entry) {
        return c.json({ error: 'Log not found' }, 404);
      }
      return c.json(entry);
    } catch {
      return c.json({ error: 'Failed to fetch log' }, 500);
    }
  }
}
