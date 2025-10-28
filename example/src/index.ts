import { Hono } from 'hono';
import { getDatabase, User } from './database';
import { filter, reduce } from 'lodash';
import { setupTelescope, startLogWatcher, startExceptionWatcher } from "../../dist"

const app = new Hono();
const db = getDatabase();

setupTelescope(app);

startLogWatcher();
startExceptionWatcher();

app.get('/', (c) => {
  return c.json({ 
    message: 'Hono Telescope Example - Real Database!',
    timestamp: new Date().toISOString(),
    endpoints: {
      users: {
        'GET /api/users': 'List all users',
        'GET /api/users/:id': 'Get specific user',
        'POST /api/users': 'Create new user',
        'PUT /api/users/:id': 'Update user',
        'DELETE /api/users/:id': 'Delete user'
      },
      external: {
        'POST /api/import-users': 'Import users from JSONPlaceholder'
      },
      telescope: '/telescope - Dashboard'
    }
  });
});

app.get('/api/users', async (c) => {
  try {
    const users = db.getAllUsers();
    const count = db.getUserCount();
    
    return c.json({
      success: true,
      data: users,
      meta: {
        total: count,
        count: users.length
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

app.get('/api/users/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid user ID'
      }, 400);
    }

    const user = db.getUserById(id);
    
    if (!user) {
      return c.json({
        success: false,
        error: 'User not found'
      }, 404);
    }

    return c.json({
      success: true,
      data: user
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

app.post('/api/users', async (c) => {
  try {
    const body = await c.req.json() as Partial<User>;
    
    if (!body.name || !body.email) {
      return c.json({
        success: false,
        error: 'Name and email fields are required'
      }, 400);
    }

    const existingUser = db.getUserByEmail(body.email);
    if (existingUser) {
      return c.json({
        success: false,
        error: 'This email address is already in use'
      }, 409);
    }

    const newUser = db.createUser({
      name: body.name,
      email: body.email,
      username: body.username ?? '',
      phone: body.phone,
      website: body.website
    });

    return c.json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Update user
app.put('/api/users/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json() as Partial<User>;
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid user ID'
      }, 400);
    }

    // Email check (if email is being updated)
    if (body.email) {
      const existingUser = db.getUserByEmail(body.email);
      if (existingUser && existingUser.id !== id) {
        return c.json({
          success: false,
          error: 'This email address is already in use'
        }, 409);
      }
    }

    const updatedUser = db.updateUser(id, body);
    
    if (!updatedUser) {
      return c.json({
        success: false,
        error: 'User not found'
      }, 404);
    }

    return c.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Delete user
app.delete('/api/users/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid user ID'
      }, 400);
    }

    const deleted = db.deleteUser(id);
    
    if (!deleted) {
      return c.json({
        success: false,
        error: 'User not found'
      }, 404);
    }

    return c.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to delete user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// 🧪 Test all routes endpoint
app.get('/api/test-all', async (c) => {
  const baseUrl = `http://localhost:3000`;
  const testResults = [];

  const routes = [
    { method: 'GET', path: '/', description: 'Homepage' },
    { method: 'GET', path: '/api/users', description: 'List all users' },
    { method: 'GET', path: '/api/users/1', description: 'Get user with ID=1' },
    { method: 'POST', path: '/api/users', description: 'Create new user', body: { name: 'Test User', email: 'test@example.com', username: 'testuser' } },
    { method: 'GET', path: '/api/error', description: 'Error test' },
    { method: 'GET', path: '/api/slow', description: 'Slow endpoint test' },
    { method: 'POST', path: '/api/import-users', description: 'Import users' },
    { method: 'GET', path: '/telescope', description: 'Telescope Dashboard' },
    { method: 'GET', path: '/telescope/api/stats', description: 'Telescope Stats API' }
  ];

  for (const route of routes) {
    try {
      const startTime = Date.now();
      const options: RequestInit = {
        method: route.method,
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (route.body) {
        options.body = JSON.stringify(route.body);
      }

      const response = await fetch(`${baseUrl}${route.path}`, options);
      const endTime = Date.now();
      const duration = endTime - startTime;

      testResults.push({
        method: route.method,
        path: route.path,
        description: route.description,
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`,
        success: response.ok,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      testResults.push({
        method: route.method,
        path: route.path,
        description: route.description,
        status: 'ERROR',
        statusText: error instanceof Error ? error.message : 'Unknown error',
        duration: '0ms',
        success: false,
        timestamp: new Date().toISOString()
      });
    }
  }

  const summary = {
    total: testResults.length,
    successful: filter(testResults, r => r.success).length,
    failed: filter(testResults, r => !r.success).length,
    totalDuration: reduce(testResults, (sum, r) => sum + parseInt(r.duration), 0) + 'ms'
  };

  return c.json({
    success: true,
    message: 'All route tests completed',
    summary,
    results: testResults,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/import-users', async (c) => {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    const externalUsers = await response.json();

    const importedUsers = [];
    const errors = [];

    for (const externalUser of externalUsers) {
      try {
        const existingUser = db.getUserByEmail(externalUser.email);
        if (existingUser) {
          errors.push(`${externalUser.email} already exists`);
          continue;
        }

        const newUser = db.createUser({
          name: externalUser.name,
          email: externalUser.email,
          username: externalUser.username,
          phone: externalUser.phone,
          website: externalUser.website
        });

        importedUsers.push(newUser);
      } catch (error) {
        errors.push(`${externalUser.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return c.json({
      success: true,
      data: {
        imported: importedUsers,
        importedCount: importedUsers.length,
        totalFetched: externalUsers.length,
        errors: errors
      },
      message: `${importedUsers.length} users imported successfully`
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to import users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

app.get('/api/error', (c) => {
  throw new Error('Test error - Database connection lost!');
});

app.get('/api/slow', async (c) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const users = db.getAllUsers();
  
  return c.json({ 
    message: 'Slow query completed',
    duration: '2 seconds',
    userCount: users.length
  });
});


export default {
  port: 3000,
  fetch: app.fetch,
};