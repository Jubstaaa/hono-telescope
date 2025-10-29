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
      const entries = await this.dashboard.getAllIncomingRequests(limit);
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
      const result = await this.dashboard.getIncomingRequest(id);
      if (!result) {
        return c.json({ error: 'Request not found' }, 404);
      }
      return c.json(result);
    } catch (error) {
      return c.json({ error: 'Failed to fetch request' }, 500);
    }
  }

  // === OUTGOING REQUESTS ===
  async getOutgoingRequests(c: Context) {
    const limit = parseInt(c.req.query('limit') || '50');
    
    try {
      const entries = await this.dashboard.getAllOutgoingRequests(limit);
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
      const entry = await this.dashboard.getOutgoingRequest(id);
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
      const entries = await this.dashboard.getAllExceptions(limit);
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
      const entry = await this.dashboard.getException(id);
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
      const entries = await this.dashboard.getAllQueries(limit);
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
      const entry = await this.dashboard.getQuery(id);
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
      const entries = await this.dashboard.getAllLogs(limit);
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
      const entry = await this.dashboard.getLog(id);
      if (!entry) {
        return c.json({ error: 'Log not found' }, 404);
      }
      return c.json(entry);
    } catch (error) {
      return c.json({ error: 'Failed to fetch log' }, 500);
    }
  }

  // === ADMIN ===
  async clearData(c: Context) {
    try {
      // Clear all entries from storage
      const telescope = this.dashboard['telescope'] || (await import('../telescope')).Telescope.getInstance();
      
      // Access repository to clear data
      const repository = telescope['repository'];
      if (repository && repository.clear) {
        await repository.clear();
        return c.json({ success: true, message: 'All telescope data cleared' });
      }
      
      return c.json({ error: 'Cannot clear data' }, 500);
    } catch (error) {
      return c.json({ error: 'Failed to clear data' }, 500);
    }
  }
}