import { telescope } from './middleware/telescope-middleware';
import { TelescopeRoutes } from './routes/telescope-routes';
import { startExceptionWatcher } from './watchers/exception-watcher';
import { startLogWatcher } from './watchers/log-watcher';
import { startQueryWatcher } from './watchers/query-watcher';
import { getExceptionClassCode } from './utils/helpers';
export function setupTelescope(app, config) {
    if (config && !config.enabled) {
        return app;
    }
    startExceptionWatcher();
    startLogWatcher();
    startQueryWatcher();
    const routes = new TelescopeRoutes();
    app.onError((error, c) => {
        const { Telescope } = require('./telescope');
        const telescopeInstance = Telescope.getInstance();
        let headers = {};
        try {
            if (c.req && c.req.header) {
                const headerEntries = c.req.raw.headers;
                if (headerEntries && typeof headerEntries.forEach === 'function') {
                    headerEntries.forEach((value, key) => {
                        headers[key] = value;
                    });
                }
            }
        }
        catch (headerError) {
            headers = {};
        }
        const exceptionData = {
            class: getExceptionClassCode(error?.constructor?.name || 'Error'),
            message: error?.message || 'Unknown error',
            trace: error?.stack?.split('\n') || [],
            context: {
                method: c.req?.method || 'UNKNOWN',
                uri: c.req?.url || 'unknown',
                headers: headers
            }
        };
        telescopeInstance.recordException(exceptionData).catch((recordError) => {
            void recordError;
        });
        return c.text('Internal Server Error', 500);
    });
    app.use('*', telescope(config));
    app.get('/telescope', routes.getDashboard.bind(routes));
    app.get('/telescope/assets/*', routes.getAsset.bind(routes));
    app.get('/telescope/api/stats', routes.getStats.bind(routes));
    app.get('/telescope/api/incoming-requests', routes.getIncomingRequests.bind(routes));
    app.get('/telescope/api/incoming-requests/:id', routes.getIncomingRequest.bind(routes));
    app.get('/telescope/api/outgoing-requests', routes.getOutgoingRequests.bind(routes));
    app.get('/telescope/api/outgoing-requests/:id', routes.getOutgoingRequest.bind(routes));
    app.get('/telescope/api/exceptions', routes.getExceptions.bind(routes));
    app.get('/telescope/api/exceptions/:id', routes.getException.bind(routes));
    app.get('/telescope/api/queries', routes.getQueries.bind(routes));
    app.get('/telescope/api/queries/:id', routes.getQuery.bind(routes));
    app.get('/telescope/api/logs', routes.getLogs.bind(routes));
    app.get('/telescope/api/logs/:id', routes.getLog.bind(routes));
    app.get('/telescope/*', routes.getDashboard.bind(routes));
    return app;
}
