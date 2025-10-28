import { Telescope } from '../telescope';
import { EntryType } from '../types';
import { readFileSync } from 'fs';
import { join } from 'path';
import { filter, reduce } from 'lodash';

export class TelescopeDashboard {
  private telescope: Telescope;

  constructor() {
    this.telescope = Telescope.getInstance();
  }

  async getEntries(type?: string, limit: number = 50) {
    return this.telescope.getEntries(type as EntryType, limit);
  }

  async getEntry(id: string) {
    return this.telescope.getEntry(id);
  }

  // New hierarchical methods
  async getIncomingRequestWithChildren(requestId: string) {
    return this.telescope.getIncomingRequestWithChildren(requestId);
  }

  async getChildEntries(parentId: string, type?: string, limit: number = 50) {
    return this.telescope.getChildEntries(parentId, type as EntryType, limit);
  }

  async clearEntries() {
    return this.telescope.clearEntries();
  }

  async getStats() {
    const entries = await this.telescope.getEntries();
    const requests = filter(entries, e => e.type === EntryType.INCOMING_REQUEST);
    const exceptions = filter(entries, e => e.type === EntryType.EXCEPTION);

    return {
      total_entries: entries.length,
      requests: {
        total: requests.length,
        by_status: this.groupByStatus(requests),
        by_method: this.groupByMethod(requests),
        avg_duration: this.calculateAverageDuration(requests)
      },
      exceptions: {
        total: exceptions.length,
        by_class: this.groupByExceptionClass(exceptions)
      }
    };
  }

  private groupByStatus(requests: any[]) {
    const grouped: Record<string, number> = {};
    requests.forEach(entry => {
      const status = Math.floor(entry.content.status / 100) * 100;
      const key = `${status}xx`;
      grouped[key] = (grouped[key] || 0) + 1;
    });
    return grouped;
  }

  private groupByMethod(requests: any[]) {
    const grouped: Record<string, number> = {};
    requests.forEach(entry => {
      const method = entry.content.method;
      grouped[method] = (grouped[method] || 0) + 1;
    });
    return grouped;
  }

  private calculateAverageDuration(requests: any[]) {
    if (requests.length === 0) return 0;
    const totalDuration = reduce(requests, (sum, entry) => sum + entry.content.duration, 0);
    return Math.round(totalDuration / requests.length);
  }

  private groupByExceptionClass(exceptions: any[]) {
    const grouped: Record<string, number> = {};
    exceptions.forEach(entry => {
      const className = entry.content.class;
      grouped[className] = (grouped[className] || 0) + 1;
    });
    return grouped;
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