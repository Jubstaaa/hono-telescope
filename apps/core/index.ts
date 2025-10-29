import { telescope } from './middleware/telescope-middleware';
import { TelescopeRoutes } from './routes/telescope-routes';
import { EntryType, EXCEPTION_CLASSES } from '@hono-telescope/types';

export { telescope } from './middleware/telescope-middleware';
export { Telescope } from './telescope';
export { HttpInterceptor } from './interceptors/http-interceptor';
export { DatabaseInterceptor } from './interceptors/database-interceptor';
export { TelescopeDashboard } from './dashboard/dashboard';
export { TelescopeRoutes } from './routes/telescope-routes';
export { startExceptionWatcher, stopExceptionWatcher } from './watchers/exception-watcher';
export { startLogWatcher, stopLogWatcher } from './watchers/log-watcher';
export { startQueryWatcher, stopQueryWatcher, recordDatabaseQuery } from './watchers/query-watcher';

// Helper function to setup telescope with routes
export function setupTelescope(app: any, config?: any) {
  const routes = new TelescopeRoutes();
  
  // Add global error handler first
  app.onError((error: any, c: any) => {
    console.log('Global error handler caught:', error?.message);
    
    // Record the exception using the singleton instance
    const { Telescope } = require('./telescope');
    const telescopeInstance = Telescope.getInstance();
    console.log('About to record exception with telescopeInstance:', !!telescopeInstance);
    console.log('Telescope config:', telescopeInstance.getConfig());
    
    // Safely get headers
    let headers: Record<string, string> = {};
    try {
      if (c.req && c.req.header) {
        // Use Hono's header method to get all headers
        const headerEntries = c.req.raw.headers;
        if (headerEntries && typeof headerEntries.forEach === 'function') {
          headerEntries.forEach((value: string, key: string) => {
            headers[key] = value;
          });
        }
      }
    } catch (headerError) {
      console.log('Error getting headers:', headerError);
      headers = {};
    }
    
    const getExceptionClassCode = (errorName: string): number => {
      switch (errorName) {
        case 'TypeError': return EXCEPTION_CLASSES.TYPE_ERROR;
        case 'SyntaxError': return EXCEPTION_CLASSES.SYNTAX_ERROR;
        case 'ReferenceError': return EXCEPTION_CLASSES.REFERENCE_ERROR;
        case 'RangeError': return EXCEPTION_CLASSES.RANGE_ERROR;
        case 'ValidationError': return EXCEPTION_CLASSES.VALIDATION_ERROR;
        default: return EXCEPTION_CLASSES.ERROR;
      }
    };
    
    const exceptionData = {
      class: getExceptionClassCode(error?.constructor?.name || 'Error'),
      file: 'unknown',
      line: 0,
      message: error?.message || 'Unknown error',
      trace: error?.stack?.split('\n') || [],
      context: {
        method: c.req?.method || 'UNKNOWN',
        uri: c.req?.url || 'unknown',
        headers: headers
      }
    };
    
    console.log('Recording exception with data:', JSON.stringify(exceptionData, null, 2));
    
    telescopeInstance.recordException(exceptionData).catch((recordError: any) => {
      console.error('Failed to record exception:', recordError);
    });
    
    return c.text('Internal Server Error', 500);
  });
  
  // Add telescope middleware
  app.use('*', telescope(config));
  
  // Dashboard routes
  app.get('/telescope', routes.getDashboard.bind(routes));
  app.get('/telescope/assets/*', routes.getAsset.bind(routes));
  app.get('/telescope/api/stats', routes.getStats.bind(routes));
  
  // === INCOMING REQUESTS (with hierarchical support) ===
  app.get('/telescope/api/incoming-requests', routes.getIncomingRequests.bind(routes));
  app.get('/telescope/api/incoming-requests/:id', routes.getIncomingRequest.bind(routes));
  
  // === OUTGOING REQUESTS ===
  app.get('/telescope/api/outgoing-requests', routes.getOutgoingRequests.bind(routes));
  app.get('/telescope/api/outgoing-requests/:id', routes.getOutgoingRequest.bind(routes));
  
  // === EXCEPTIONS ===
  app.get('/telescope/api/exceptions', routes.getExceptions.bind(routes));
  app.get('/telescope/api/exceptions/:id', routes.getException.bind(routes));
  
  // === QUERIES ===
  app.get('/telescope/api/queries', routes.getQueries.bind(routes));
  app.get('/telescope/api/queries/:id', routes.getQuery.bind(routes));
  
  // === LOGS ===
  app.get('/telescope/api/logs', routes.getLogs.bind(routes));
  app.get('/telescope/api/logs/:id', routes.getLog.bind(routes));
  
  // === ADMIN ===
  app.post('/telescope/api/admin/clear', routes.clearData.bind(routes));
  
  // Fallback route for React Router - redirect all /telescope/* paths to main dashboard
  app.get('/telescope/*', routes.getDashboard.bind(routes));
  
  return app;
}