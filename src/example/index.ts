import type { AxiosError } from 'axios';
import axios from 'axios';
import dayjs from 'dayjs';
import { Hono } from 'hono';

import { createTelescope, memoryStorage } from '../index.js';

import type { User } from './database.js';
import { DatabaseManager } from './database.js';

(globalThis as unknown as Record<string, unknown>).axios = axios;

const formatDate = (): string => {
  return `[${dayjs().format('YYYY-MM-DD HH:mm:ss.SSS')}]`;
};

const app = new Hono();
// The hosted demo runs with NODE_ENV=production, where Telescope disables itself and
// refuses to mount the dashboard without credentials. `auth: false` is the documented
// acknowledgement that this instance is deliberately public.
const telescope = createTelescope({
  dashboard: { auth: false },
  enabled: true,
  storage: memoryStorage({ maxEntries: 500 }),
});

app.use('*', telescope.middleware());
app.route('/telescope', telescope.dashboard());

const db = new DatabaseManager('example.db', (database) => telescope.instrumentBunSqlite(database));

app.get('/', (c) => {
  console.log(`${formatDate()} GET /`);
  return c.json({
    endpoints: {
      external: {
        'POST /api/import-users': 'Import users from JSONPlaceholder',
        'POST /api/webhook': 'Outgoing POST whose payload is recorded and redacted',
      },
      failures: {
        'GET /api/error': 'Throws, recorded as an exception under its request',
        'POST /api/db-error': 'Deliberate UNIQUE violation, recorded as a failed query',
      },
      telescope: '/telescope - Dashboard',
      users: {
        'DELETE /api/users/:id': 'Delete user',
        'GET /api/users': 'List all users',
        'GET /api/users/:id': 'Get specific user',
        'POST /api/users': 'Create new user',
        'PUT /api/users/:id': 'Update user',
      },
    },
    message: 'Hono Telescope Example - Real Database!',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/users', async (c) => {
  console.log(`${formatDate()} GET /api/users`);
  try {
    const users = db.getAllUsers();
    const count = db.getUserCount();

    return c.json({
      data: users,
      meta: {
        count: users.length,
        total: count,
      },
      success: true,
    });
  } catch (error) {
    return c.json(
      {
        details: error instanceof Error ? error.message : 'Unknown error',
        error: 'Failed to fetch users',
        success: false,
      },
      500
    );
  }
});

app.get('/api/users/:id', async (c) => {
  console.log(`${formatDate()} GET /api/users/:id - ID: ${c.req.param('id')}`);
  try {
    const id = parseInt(c.req.param('id'));

    if (isNaN(id)) {
      return c.json(
        {
          error: 'Invalid user ID',
          success: false,
        },
        400
      );
    }

    const user = db.getUserById(id);

    if (!user) {
      return c.json(
        {
          error: 'User not found',
          success: false,
        },
        404
      );
    }

    return c.json({
      data: user,
      success: true,
    });
  } catch (error) {
    return c.json(
      {
        details: error instanceof Error ? error.message : 'Unknown error',
        error: 'Failed to fetch user',
        success: false,
      },
      500
    );
  }
});

app.post('/api/users', async (c) => {
  console.log(`${formatDate()} POST /api/users`);
  try {
    const body = (await c.req.json()) as Partial<User>;

    if (!body.name || !body.email) {
      return c.json(
        {
          error: 'Name and email fields are required',
          success: false,
        },
        400
      );
    }

    const existingUser = db.getUserByEmail(body.email);
    if (existingUser) {
      return c.json(
        {
          error: 'This email address is already in use',
          success: false,
        },
        409
      );
    }

    const newUser = db.createUser({
      email: body.email,
      name: body.name,
      phone: body.phone,
      username: body.username ?? '',
      website: body.website,
    });

    return c.json(
      {
        data: newUser,
        message: 'User created successfully',
        success: true,
      },
      201
    );
  } catch (error) {
    return c.json(
      {
        details: error instanceof Error ? error.message : 'Unknown error',
        error: 'Failed to create user',
        success: false,
      },
      500
    );
  }
});

app.put('/api/users/:id', async (c) => {
  console.log(`${formatDate()} PUT /api/users/:id - ID: ${c.req.param('id')}`);
  try {
    const id = parseInt(c.req.param('id'));
    const body = (await c.req.json()) as Partial<User>;

    if (isNaN(id)) {
      return c.json(
        {
          error: 'Invalid user ID',
          success: false,
        },
        400
      );
    }

    if (body.email) {
      const existingUser = db.getUserByEmail(body.email);
      if (existingUser && existingUser.id !== id) {
        return c.json(
          {
            error: 'This email address is already in use',
            success: false,
          },
          409
        );
      }
    }

    const updatedUser = db.updateUser(id, body);

    if (!updatedUser) {
      return c.json(
        {
          error: 'User not found',
          success: false,
        },
        404
      );
    }

    return c.json({
      data: updatedUser,
      message: 'User updated successfully',
      success: true,
    });
  } catch (error) {
    return c.json(
      {
        details: error instanceof Error ? error.message : 'Unknown error',
        error: 'Failed to update user',
        success: false,
      },
      500
    );
  }
});

app.delete('/api/users/:id', async (c) => {
  console.log(`${formatDate()} DELETE /api/users/:id - ID: ${c.req.param('id')}`);
  try {
    const id = parseInt(c.req.param('id'));

    if (isNaN(id)) {
      return c.json(
        {
          error: 'Invalid user ID',
          success: false,
        },
        400
      );
    }

    const deleted = db.deleteUser(id);

    if (!deleted) {
      return c.json(
        {
          error: 'User not found',
          success: false,
        },
        404
      );
    }

    return c.json({
      message: 'User deleted successfully',
      success: true,
    });
  } catch (error) {
    return c.json(
      {
        details: error instanceof Error ? error.message : 'Unknown error',
        error: 'Failed to delete user',
        success: false,
      },
      500
    );
  }
});

app.post('/api/import-users', async (c) => {
  console.log(`${formatDate()} POST /api/import-users`);
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
          email: externalUser.email,
          name: externalUser.name,
          phone: externalUser.phone,
          username: externalUser.username,
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
      data: {
        errors: errors,
        imported: importedUsers,
        importedCount: importedUsers.length,
        totalFetched: externalUsers.length,
      },
      message: `${importedUsers.length} users imported successfully`,
      success: true,
    });
  } catch (error) {
    return c.json(
      {
        details: error instanceof Error ? error.message : 'Unknown error',
        error: 'Failed to import users',
        success: false,
      },
      500
    );
  }
});

app.post('/api/db-error', (c) => {
  console.log(`${formatDate()} POST /api/db-error`);

  const email = 'duplicate@telescope.demo';
  if (!db.getUserByEmail(email)) {
    db.createUser({ email, name: 'Telescope Demo', username: 'telescope-demo' });
  }

  try {
    db.createUser({ email, name: 'Telescope Demo', username: 'telescope-demo' });

    return c.json(
      { error: 'expected a UNIQUE violation and did not get one', success: false },
      500
    );
  } catch (error) {
    return c.json(
      {
        details: error instanceof Error ? error.message : 'Unknown error',
        error: 'Insert rejected by the UNIQUE constraint, on purpose',
        note: 'The failing INSERT is recorded as a failed query. Nothing threw out of the handler, so this request has no exception entry — find it with recent_requests({ minStatus: 400 }).',
        success: false,
      },
      409
    );
  }
});

app.post('/api/webhook', async (c) => {
  console.log(`${formatDate()} POST /api/webhook`);

  const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
    body: JSON.stringify({ title: 'telescope', token: 'super-secret-token', userId: 1 }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });

  return c.json({
    data: await response.json(),
    note: 'The outgoing entry records this request payload, with `token` redacted.',
    success: true,
    upstream_status: response.status,
  });
});

app.get('/api/error', (_) => {
  console.log(`${formatDate()} GET /api/error`);
  throw new Error('Test error - Database connection lost!');
});

app.get('/api/slow', async (c) => {
  console.log(`${formatDate()} GET /api/slow`);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const users = db.getAllUsers();

  return c.json({
    duration: '2 seconds',
    message: 'Slow query completed',
    userCount: users.length,
  });
});

app.get('/api/axios-test', async (c) => {
  console.log(`${formatDate()} GET /api/axios-test`);
  try {
    // Test 1: GET request with axios
    const getResponse = await axios.get('https://jsonplaceholder.typicode.com/posts/1');

    // Test 2: POST request with axios
    const postResponse = await axios.post('https://jsonplaceholder.typicode.com/posts', {
      body: 'Testing axios interceptor functionality',
      title: 'Hono Telescope Test',
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
      message: 'Axios tests completed',
      note: 'Check Telescope dashboard for outgoing request logs',
      results: {
        error: errorResponse,
        get: {
          dataSize: JSON.stringify(getResponse.data).length,
          status: getResponse.status,
          title: getResponse.data.title,
        },
        post: {
          id: postResponse.data.id,
          status: postResponse.status,
          title: postResponse.data.title,
        },
      },
      success: true,
    });
  } catch (error) {
    return c.json(
      {
        details: error instanceof Error ? error.message : 'Unknown error',
        error: 'Axios test failed',
        success: false,
      },
      500
    );
  }
});

app.get('/api/mixed-clients-test', async (c) => {
  console.log(`${formatDate()} GET /api/mixed-clients-test`);
  try {
    const results = [];

    // Test with native fetch
    const fetchStart = Date.now();
    const fetchResponse = await fetch('https://jsonplaceholder.typicode.com/users/1');
    const fetchData = await fetchResponse.json();
    const fetchDuration = Date.now() - fetchStart;

    results.push({
      client: 'fetch',
      dataPreview: fetchData.name,
      duration: `${fetchDuration}ms`,
      method: 'GET',
      status: fetchResponse.status,
      url: 'https://jsonplaceholder.typicode.com/users/1',
    });

    // Test with axios
    const axiosStart = Date.now();
    const axiosResponse = await axios.get('https://jsonplaceholder.typicode.com/users/2');
    const axiosDuration = Date.now() - axiosStart;

    results.push({
      client: 'axios',
      dataPreview: axiosResponse.data.name,
      duration: `${axiosDuration}ms`,
      method: 'GET',
      status: axiosResponse.status,
      url: 'https://jsonplaceholder.typicode.com/users/2',
    });

    // Test axios POST to JSONPlaceholder
    const axiosPostResponse = await axios.post('https://jsonplaceholder.typicode.com/posts', {
      body: 'bar',
      createdWith: 'Hono Telescope mixed clients test',
      timestamp: new Date().toISOString(),
      title: 'foo',
      userId: 1,
    });

    results.push({
      client: 'axios',
      dataPreview: `POST created: id ${axiosPostResponse.data.id}`,
      duration: 'N/A',
      method: 'POST',
      status: axiosPostResponse.status,
      url: 'https://jsonplaceholder.typicode.com/posts',
    });

    return c.json({
      message: 'Mixed HTTP clients test completed',
      note: 'Check Telescope dashboard to see both fetch and axios requests tracked separately',
      results,
      success: true,
    });
  } catch (error) {
    return c.json(
      {
        details: error instanceof Error ? error.message : 'Unknown error',
        error: 'Mixed clients test failed',
        success: false,
      },
      500
    );
  }
});

const port = parseInt(process.env.PORT || '3000');

export default {
  fetch: app.fetch,
  idleTimeout: 60,
  port,
};
