import type { Context } from 'hono';
import { TelescopeDashboard } from '../dashboard/dashboard';

export class TelescopeRoutes {
  private dashboard: TelescopeDashboard;

  constructor() {
    this.dashboard = new TelescopeDashboard();
  }

  async getDashboard(c: Context) {
    // React dashboard'ın index.html dosyasını serve et
    const content = this.dashboard.getAssetContent('index.html');
    if (!content) {
      // Fallback olarak eski HTML dashboard'ı kullan
      const html = this.dashboard.generateDashboardHTML();
      return c.html(html);
    }
    
    const htmlContent = new TextDecoder().decode(new Uint8Array(content));
    return c.html(htmlContent);
  }

  // Stats endpoint - sadece istatistikler
  async getStats(c: Context) {
    try {
      const stats = await this.dashboard.getStats();
      return c.json(stats);
    } catch (error) {
      return c.json({ error: 'Failed to fetch stats' }, 500);
    }
  }

  // Clear functionality
  async clearEntries(c: Context) {
    try {
      const result = await this.dashboard.clearEntries();
      return c.json(result);
    } catch (error) {
      return c.json({ error: 'Failed to clear entries' }, 500);
    }
  }

  // React dashboard asset'lerini serve et
  async getAsset(c: Context) {
    const fullPath = c.req.path;
    const assetPath = fullPath.replace('/telescope/assets/', '');
    console.log('Asset requested:', assetPath); // Debug log
    const content = this.dashboard.getAssetContent(assetPath);
    
    if (!content) {
      console.log('Asset not found:', assetPath); // Debug log
      return c.notFound();
    }

    const mimeType = this.dashboard.getAssetMimeType(assetPath);
    console.log('Serving asset:', assetPath, 'Type:', mimeType); // Debug log
    return new Response(new Uint8Array(content), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  }

  // === INCOMING REQUESTS ===
  async getIncomingRequests(c: Context) {
    const limit = parseInt(c.req.query('limit') || '50');
    
    try {
      const entries = await this.dashboard.getEntries('incoming_request', limit);
      return c.json(entries);
    } catch (error) {
      return c.json({ error: 'Failed to fetch incoming requests' }, 500);
    }
  }

  async getIncomingRequest(c: Context) {
    const id = c.req.param('id');
    
    if (!id) {
      return c.json({ error: 'Request ID is required' }, 400);
    }
    
    try {
      const result = await this.dashboard.getIncomingRequestWithChildren(id);
      if (!result) {
        return c.json({ error: 'Request not found' }, 404);
      }
      return c.json(result);
    } catch (error) {
      return c.json({ error: 'Failed to fetch request with children' }, 500);
    }
  }

  // === OUTGOING REQUESTS ===
  async getOutgoingRequests(c: Context) {
    const limit = parseInt(c.req.query('limit') || '50');
    
    try {
      const entries = await this.dashboard.getEntries('outgoing_request', limit);
      return c.json(entries);
    } catch (error) {
      return c.json({ error: 'Failed to fetch outgoing requests' }, 500);
    }
  }

  async getOutgoingRequest(c: Context) {
    const id = c.req.param('id');
    
    if (!id) {
      return c.json({ error: 'Request ID is required' }, 400);
    }
    
    try {
      const entry = await this.dashboard.getEntry(id);
      if (!entry) {
        return c.json({ error: 'Request not found' }, 404);
      }
      return c.json(entry);
    } catch (error) {
      return c.json({ error: 'Failed to fetch request' }, 500);
    }
  }

  // === EXCEPTIONS ===
  async getExceptions(c: Context) {
    const limit = parseInt(c.req.query('limit') || '50');
    
    try {
      const entries = await this.dashboard.getEntries('exception', limit);
      return c.json(entries);
    } catch (error) {
      return c.json({ error: 'Failed to fetch exceptions' }, 500);
    }
  }

  async getException(c: Context) {
    const id = c.req.param('id');
    
    if (!id) {
      return c.json({ error: 'Exception ID is required' }, 400);
    }
    
    try {
      const entry = await this.dashboard.getEntry(id);
      if (!entry) {
        return c.json({ error: 'Exception not found' }, 404);
      }
      return c.json(entry);
    } catch (error) {
      return c.json({ error: 'Failed to fetch exception' }, 500);
    }
  }

  // === QUERIES ===
  async getQueries(c: Context) {
    const limit = parseInt(c.req.query('limit') || '50');
    
    try {
      const entries = await this.dashboard.getEntries('query', limit);
      return c.json(entries);
    } catch (error) {
      return c.json({ error: 'Failed to fetch queries' }, 500);
    }
  }

  async getQuery(c: Context) {
    const id = c.req.param('id');
    
    if (!id) {
      return c.json({ error: 'Query ID is required' }, 400);
    }
    
    try {
      const entry = await this.dashboard.getEntry(id);
      if (!entry) {
        return c.json({ error: 'Query not found' }, 404);
      }
      return c.json(entry);
    } catch (error) {
      return c.json({ error: 'Failed to fetch query' }, 500);
    }
  }

  // === LOGS ===
  async getLogs(c: Context) {
    const limit = parseInt(c.req.query('limit') || '50');
    
    try {
      const entries = await this.dashboard.getEntries('log', limit);
      return c.json(entries);
    } catch (error) {
      return c.json({ error: 'Failed to fetch logs' }, 500);
    }
  }

  async getLog(c: Context) {
    const id = c.req.param('id');
    
    if (!id) {
      return c.json({ error: 'Log ID is required' }, 400);
    }
    
    try {
      const entry = await this.dashboard.getEntry(id);
      if (!entry) {
        return c.json({ error: 'Log not found' }, 404);
      }
      return c.json(entry);
    } catch (error) {
      return c.json({ error: 'Failed to fetch log' }, 500);
    }
  }

  // === JOBS ===
  async getJobs(c: Context) {
    const limit = parseInt(c.req.query('limit') || '50');
    
    try {
      const entries = await this.dashboard.getEntries('job', limit);
      return c.json(entries);
    } catch (error) {
      return c.json({ error: 'Failed to fetch jobs' }, 500);
    }
  }

  async getJob(c: Context) {
    const id = c.req.param('id');
    
    if (!id) {
      return c.json({ error: 'Job ID is required' }, 400);
    }
    
    try {
      const entry = await this.dashboard.getEntry(id);
      if (!entry) {
        return c.json({ error: 'Job not found' }, 404);
      }
      return c.json(entry);
    } catch (error) {
      return c.json({ error: 'Failed to fetch job' }, 500);
    }
  }

  // === CACHE ===
  async getCacheEntries(c: Context) {
    const limit = parseInt(c.req.query('limit') || '50');
    
    try {
      const entries = await this.dashboard.getEntries('cache', limit);
      return c.json(entries);
    } catch (error) {
      return c.json({ error: 'Failed to fetch cache entries' }, 500);
    }
  }

  async getCacheEntry(c: Context) {
    const id = c.req.param('id');
    
    if (!id) {
      return c.json({ error: 'Cache entry ID is required' }, 400);
    }
    
    try {
      const entry = await this.dashboard.getEntry(id);
      if (!entry) {
        return c.json({ error: 'Cache entry not found' }, 404);
      }
      return c.json(entry);
    } catch (error) {
      return c.json({ error: 'Failed to fetch cache entry' }, 500);
    }
  }

  // === MAIL ===
  async getMailEntries(c: Context) {
    const limit = parseInt(c.req.query('limit') || '50');
    
    try {
      const entries = await this.dashboard.getEntries('mail', limit);
      return c.json(entries);
    } catch (error) {
      return c.json({ error: 'Failed to fetch mail entries' }, 500);
    }
  }

  async getMailEntry(c: Context) {
    const id = c.req.param('id');
    
    if (!id) {
      return c.json({ error: 'Mail entry ID is required' }, 400);
    }
    
    try {
      const entry = await this.dashboard.getEntry(id);
      if (!entry) {
        return c.json({ error: 'Mail entry not found' }, 404);
      }
      return c.json(entry);
    } catch (error) {
      return c.json({ error: 'Failed to fetch mail entry' }, 500);
    }
  }

  // === NOTIFICATIONS ===
  async getNotifications(c: Context) {
    const limit = parseInt(c.req.query('limit') || '50');
    
    try {
      const entries = await this.dashboard.getEntries('notification', limit);
      return c.json(entries);
    } catch (error) {
      return c.json({ error: 'Failed to fetch notifications' }, 500);
    }
  }

  async getNotification(c: Context) {
    const id = c.req.param('id');
    
    if (!id) {
      return c.json({ error: 'Notification ID is required' }, 400);
    }
    
    try {
      const entry = await this.dashboard.getEntry(id);
      if (!entry) {
        return c.json({ error: 'Notification not found' }, 404);
      }
      return c.json(entry);
    } catch (error) {
      return c.json({ error: 'Failed to fetch notification' }, 500);
    }
  }

  // === DUMPS ===
  async getDumps(c: Context) {
    const limit = parseInt(c.req.query('limit') || '50');
    
    try {
      const entries = await this.dashboard.getEntries('dump', limit);
      return c.json(entries);
    } catch (error) {
      return c.json({ error: 'Failed to fetch dumps' }, 500);
    }
  }

  async getDump(c: Context) {
    const id = c.req.param('id');
    
    if (!id) {
      return c.json({ error: 'Dump ID is required' }, 400);
    }
    
    try {
      const entry = await this.dashboard.getEntry(id);
      if (!entry) {
        return c.json({ error: 'Dump not found' }, 404);
      }
      return c.json(entry);
    } catch (error) {
      return c.json({ error: 'Failed to fetch dump' }, 500);
    }
  }
}