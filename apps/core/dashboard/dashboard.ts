import { Telescope } from '../telescope';
import { EntryType } from '@hono-telescope/types';
import { readFileSync } from 'fs';
import { join } from 'path';
import { filter } from 'lodash';

export class TelescopeDashboard {
  private telescope: Telescope;

  constructor() {
    this.telescope = Telescope.getInstance();
  }

  // === INCOMING REQUESTS ===
  async getAllIncomingRequests(limit: number = 50) {
    return this.telescope.getAllIncomingRequests(limit);
  }

  async getIncomingRequest(id: string) {
    const entry = await this.telescope.getIncomingRequest(id);
    if (!entry) return null;
    
    // Get child entries organized by type
    const childResult = await this.telescope.getIncomingRequestWithChildren(id);
    const allChildren = childResult?.children || [];
    
    return {
      ...entry,
      relation_entries: {
        logs: allChildren.filter(e => e.type === EntryType.LOG),
        queries: allChildren.filter(e => e.type === EntryType.QUERY),
        exceptions: allChildren.filter(e => e.type === EntryType.EXCEPTION),
        outgoingRequests: allChildren.filter(e => e.type === EntryType.OUTGOING_REQUEST)
      }
    };
  }

  // === OUTGOING REQUESTS ===
  async getAllOutgoingRequests(limit: number = 50) {
    return this.telescope.getAllOutgoingRequests(limit);
  }

  async getOutgoingRequest(id: string) {
    return this.telescope.getOutgoingRequest(id);
  }

  // === EXCEPTIONS ===
  async getAllExceptions(limit: number = 50) {
    return this.telescope.getAllExceptions(limit);
  }

  async getException(id: string) {
    return this.telescope.getException(id);
  }

  // === QUERIES ===
  async getAllQueries(limit: number = 50) {
    return this.telescope.getAllQueries(limit);
  }

  async getQuery(id: string) {
    const entry = await this.telescope.getQuery(id);
    if (!entry) return null;
    
    // Query entries don't have child entries, return as-is
    return entry;
  }

  // === LOGS ===
  async getAllLogs(limit: number = 50) {
    return this.telescope.getAllLogs(limit);
  }

  async getLog(id: string) {
    return this.telescope.getLog(id);
  }

  // === STATS ===
  async getStats() {
    const allIncoming = await this.telescope.getAllIncomingRequests();
    const allOutgoing = await this.telescope.getAllOutgoingRequests();
    const allExceptions = await this.telescope.getAllExceptions();
    const allLogs = await this.telescope.getAllLogs();
    const allQueries = await this.telescope.getAllQueries();

    return {
      incomingRequests: {total: allIncoming.length},
      outgoingRequests: {total: allOutgoing.length},
      exceptions: {
        total: allExceptions.length
      },
      queries: {
        total: allQueries.length
      },
      logs: {
        total: allLogs.length
      }
    };
  }

  // New methods to serve React Dashboard
  generateDashboardHTML(): string {
    try {
      const htmlPath = join(__dirname, 'index.html');
      console.log('Reading HTML from:', htmlPath); // Debug log
      let html = readFileSync(htmlPath, 'utf-8');
      console.log('HTML content length:', html.length); // Debug log
      
      // Fix asset paths
      html = html.replace(/\/assets\//g, '/telescope/assets/');
      
      return html;
    } catch (error) {
      console.error('Error reading dashboard HTML:', error);
      console.log('Falling back to default HTML'); // Debug log
      return this.getFallbackHTML();
    }
  }

  getAssetContent(assetPath: string): Buffer | null {
    try {
      let fullPath: string;
      
      if (assetPath === 'index.html') {
        // index.html file is in the root of the dashboard folder
        fullPath = join(__dirname, 'index.html');
      } else {
        // Other assets are in the assets/ folder
        const cleanPath = assetPath.replace(/^assets\//, '');
        fullPath = join(__dirname, 'assets', cleanPath);
      }
      
      return readFileSync(fullPath);
    } catch (error) {
      console.error('Error reading asset:', error, 'Path:', assetPath);
      return null;
    }
  }

  getAssetMimeType(assetPath: string): string {
    if (assetPath.endsWith('.js')) return 'application/javascript';
    if (assetPath.endsWith('.css')) return 'text/css';
    if (assetPath.endsWith('.map')) return 'application/json';
    return 'text/plain';
  }

  private getFallbackHTML(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hono Telescope</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            margin: 0;
            padding: 2rem;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            max-width: 600px;
        }
        h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
            color: #3b82f6;
        }
        p {
            font-size: 1.1rem;
            line-height: 1.6;
            color: #94a3b8;
            margin-bottom: 2rem;
        }
        .error {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 1.5rem;
            margin-top: 2rem;
        }
        .error h2 {
            color: #ef4444;
            margin-bottom: 1rem;
        }
        .error p {
            color: #cbd5e1;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔭 Hono Telescope</h1>
        <p>Dashboard is loading...</p>
        <div class="error">
            <h2>Dashboard Not Available</h2>
            <p>The React dashboard could not be loaded. Please check the console for errors.</p>
        </div>
    </div>
</body>
</html>`;
  }
}