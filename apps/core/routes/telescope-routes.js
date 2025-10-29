import { TelescopeDashboard } from '../dashboard/dashboard';
export class TelescopeRoutes {
    dashboard;
    constructor() {
        this.dashboard = new TelescopeDashboard();
    }
    async getDashboard(c) {
        const content = this.dashboard.getAsset('index.html');
        if (!content) {
            const html = this.dashboard.getDashboardHtml();
            return c.html(html);
        }
        return c.html(content);
    }
    async getStats(c) {
        try {
            const stats = await this.dashboard.getStats();
            return c.json(stats);
        }
        catch (error) {
            return c.json({ error: 'Failed to fetch stats' }, 500);
        }
    }
    async getAsset(c) {
        const fullPath = c.req.path;
        const assetPath = fullPath.replace('/telescope/assets/', '');
        const content = this.dashboard.getAsset(assetPath);
        if (!content) {
            return c.notFound();
        }
        const mimeType = this.dashboard.getAsset(assetPath);
        return c.html(content);
    }
    async getIncomingRequests(c) {
        try {
            const entries = await this.dashboard.getAllIncomingRequests();
            return c.json(entries);
        }
        catch (error) {
            return c.json({ error: 'Failed to fetch incoming requests' }, 500);
        }
    }
    async getIncomingRequest(c) {
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
        }
        catch (error) {
            return c.json({ error: 'Failed to fetch request' }, 500);
        }
    }
    async getOutgoingRequests(c) {
        try {
            const entries = await this.dashboard.getAllOutgoingRequests();
            return c.json(entries);
        }
        catch (error) {
            return c.json({ error: 'Failed to fetch outgoing requests' }, 500);
        }
    }
    async getOutgoingRequest(c) {
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
        }
        catch (error) {
            return c.json({ error: 'Failed to fetch request' }, 500);
        }
    }
    async getExceptions(c) {
        try {
            const entries = await this.dashboard.getAllExceptions();
            return c.json(entries);
        }
        catch (error) {
            return c.json({ error: 'Failed to fetch exceptions' }, 500);
        }
    }
    async getException(c) {
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
        }
        catch (error) {
            return c.json({ error: 'Failed to fetch exception' }, 500);
        }
    }
    async getQueries(c) {
        try {
            const entries = await this.dashboard.getAllQueries();
            return c.json(entries);
        }
        catch (error) {
            return c.json({ error: 'Failed to fetch queries' }, 500);
        }
    }
    async getQuery(c) {
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
        }
        catch (error) {
            return c.json({ error: 'Failed to fetch query' }, 500);
        }
    }
    async getLogs(c) {
        try {
            const entries = await this.dashboard.getAllLogs();
            return c.json(entries);
        }
        catch (error) {
            return c.json({ error: 'Failed to fetch logs' }, 500);
        }
    }
    async getLog(c) {
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
        }
        catch (error) {
            return c.json({ error: 'Failed to fetch log' }, 500);
        }
    }
}
