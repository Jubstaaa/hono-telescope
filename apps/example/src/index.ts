import { Hono } from 'hono';
import { getDatabase, User } from './database';
import { setupTelescope } from '../../core/dist/index.js';
import axios, { AxiosError } from 'axios';

// Make axios available globally for the interceptor
(globalThis as unknown as Record<string, unknown>).axios = axios;

const app = new Hono();
const db = getDatabase();

setupTelescope(app);

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
        'DELETE /api/users/:id': 'Delete user',
      },
      external: {
        'POST /api/import-users': 'Import users from JSONPlaceholder',
      },
      telescope: '/telescope - Dashboard',
    },
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
        count: users.length,
      },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

app.get('/api/users/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));

    if (isNaN(id)) {
      return c.json(
        {
          success: false,
          error: 'Invalid user ID',
        },
        400
      );
    }

    const user = db.getUserById(id);

    if (!user) {
      return c.json(
        {
          success: false,
          error: 'User not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to fetch user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

app.post('/api/users', async (c) => {
  try {
    const body = (await c.req.json()) as Partial<User>;

    if (!body.name || !body.email) {
      return c.json(
        {
          success: false,
          error: 'Name and email fields are required',
        },
        400
      );
    }

    const existingUser = db.getUserByEmail(body.email);
    if (existingUser) {
      return c.json(
        {
          success: false,
          error: 'This email address is already in use',
        },
        409
      );
    }

    const newUser = db.createUser({
      name: body.name,
      email: body.email,
      username: body.username ?? '',
      phone: body.phone,
      website: body.website,
    });

    return c.json(
      {
        success: true,
        data: newUser,
        message: 'User created successfully',
      },
      201
    );
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Update user
app.put('/api/users/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = (await c.req.json()) as Partial<User>;

    if (isNaN(id)) {
      return c.json(
        {
          success: false,
          error: 'Invalid user ID',
        },
        400
      );
    }

    // Email check (if email is being updated)
    if (body.email) {
      const existingUser = db.getUserByEmail(body.email);
      if (existingUser && existingUser.id !== id) {
        return c.json(
          {
            success: false,
            error: 'This email address is already in use',
          },
          409
        );
      }
    }

    const updatedUser = db.updateUser(id, body);

    if (!updatedUser) {
      return c.json(
        {
          success: false,
          error: 'User not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to update user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Delete user
app.delete('/api/users/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));

    if (isNaN(id)) {
      return c.json(
        {
          success: false,
          error: 'Invalid user ID',
        },
        400
      );
    }

    const deleted = db.deleteUser(id);

    if (!deleted) {
      return c.json(
        {
          success: false,
          error: 'User not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to delete user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
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
          website: externalUser.website,
        });

        importedUsers.push(newUser);
      } catch (error) {
        errors.push(
          `${externalUser.email}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return c.json({
      success: true,
      data: {
        imported: importedUsers,
        importedCount: importedUsers.length,
        totalFetched: externalUsers.length,
        errors: errors,
      },
      message: `${importedUsers.length} users imported successfully`,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to import users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

app.get('/api/error', (_) => {
  throw new Error('Test error - Database connection lost!');
});

app.get('/api/slow', async (c) => {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const users = db.getAllUsers();

  return c.json({
    message: 'Slow query completed',
    duration: '2 seconds',
    userCount: users.length,
  });
});

// 🌐 Axios test endpoints
app.get('/api/axios-test', async (c) => {
  try {
    // Test 1: GET request with axios
    const getResponse = await axios.get('https://jsonplaceholder.typicode.com/posts/1');

    // Test 2: POST request with axios
    const postResponse = await axios.post('https://jsonplaceholder.typicode.com/posts', {
      title: 'Hono Telescope Test',
      body: 'Testing axios interceptor functionality',
      userId: 1,
    });

    // Test 3: Error handling with axios
    let errorResponse = null;
    try {
      await axios.get('https://jsonplaceholder.typicode.com/posts/999999');
    } catch (error: unknown) {
      const axiosError = error instanceof Error ? error : new Error(String(error));
      errorResponse = {
        message: axiosError.message,
        status: (error as AxiosError)?.response?.status || 'No response',
      };
    }

    return c.json({
      success: true,
      message: 'Axios tests completed',
      results: {
        get: {
          status: getResponse.status,
          title: getResponse.data.title,
          dataSize: JSON.stringify(getResponse.data).length,
        },
        post: {
          status: postResponse.status,
          id: postResponse.data.id,
          title: postResponse.data.title,
        },
        error: errorResponse,
      },
      note: 'Check Telescope dashboard for outgoing request logs',
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Axios test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// 🔄 Mixed HTTP clients test
app.get('/api/mixed-clients-test', async (c) => {
  try {
    const results = [];

    // Test with native fetch
    const fetchStart = Date.now();
    const fetchResponse = await fetch('https://jsonplaceholder.typicode.com/users/1');
    const fetchData = await fetchResponse.json();
    const fetchDuration = Date.now() - fetchStart;

    results.push({
      client: 'fetch',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/users/1',
      status: fetchResponse.status,
      duration: `${fetchDuration}ms`,
      dataPreview: fetchData.name,
    });

    // Test with axios
    const axiosStart = Date.now();
    const axiosResponse = await axios.get('https://jsonplaceholder.typicode.com/users/2');
    const axiosDuration = Date.now() - axiosStart;

    results.push({
      client: 'axios',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/users/2',
      status: axiosResponse.status,
      duration: `${axiosDuration}ms`,
      dataPreview: axiosResponse.data.name,
    });

    // Test axios POST
    const axiosPostResponse = await axios.post('https://httpbin.org/post', {
      message: 'Testing axios POST with Hono Telescope',
      timestamp: new Date().toISOString(),
    });

    results.push({
      client: 'axios',
      method: 'POST',
      url: 'https://httpbin.org/post',
      status: axiosPostResponse.status,
      duration: 'N/A',
      dataPreview: 'POST data sent successfully',
    });

    return c.json({
      success: true,
      message: 'Mixed HTTP clients test completed',
      results,
      note: 'Check Telescope dashboard to see both fetch and axios requests tracked separately',
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Mixed clients test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default {
  port: 3000,
  fetch: app.fetch,
  idleTimeout: 60,
};
