# 🔭 Hono Telescope v0.1.11

**Your new debugging companion for Hono applications!**

## 🎯 What is Hono Telescope?

Hono Telescope is a **Laravel Telescope-inspired debugging and monitoring tool** built specifically for Hono.js applications. If you've loved Laravel Telescope, you'll love this for your Hono apps.

## ✨ Key Features

✅ **Real-time HTTP Request Monitoring** - See exactly what requests come in and go out  
✅ **Exception Tracking** - Catch and monitor errors with full stack traces  
✅ **Console Log Capture** - Monitor all your app's logs in one place  
✅ **Database Query Tracking** - Track queries from Prisma, Sequelize, MongoDB, or Bun SQLite  
✅ **Beautiful Web Dashboard** - Modern React-based interface with real-time updates  
✅ **Zero Configuration** - Works out of the box, no complex setup needed  
✅ **Bun & Node.js** - Works seamlessly with both runtimes  
✅ **TypeScript First** - Full type safety and autocomplete

## 📦 Installation

```bash
npm install hono-telescope
# or
bun add hono-telescope
# or
yarn add hono-telescope
# or
pnpm add hono-telescope
```

## 🚀 Quick Start

```typescript
import { Hono } from 'hono';
import { setupTelescope } from 'hono-telescope';

const app = new Hono();

// One line setup
setupTelescope(app);

// Your routes work normally
app.get('/api/users', (c) => {
  console.log('Fetching users');
  return c.json({ users: [] });
});

export default app;
```

Visit `http://localhost:3000/telescope` to open your dashboard.

## 🎮 Live Demo

**Try it now without installing anything:**  
👉 **[Hono Telescope Dashboard](https://hono-telescope-9lvpv.ondigitalocean.app/telescope)**

**API Base URL:** `https://hono-telescope-9lvpv.ondigitalocean.app`

### Test the Demo

```bash
# Get all users
curl https://hono-telescope-9lvpv.ondigitalocean.app/api/users

# Create a user
curl -X POST https://hono-telescope-9lvpv.ondigitalocean.app/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com"}'

# Trigger an error
curl https://hono-telescope-9lvpv.ondigitalocean.app/api/error

# Run all tests
bash <(curl -s https://raw.githubusercontent.com/jubstaaa/hono-telescope/main/src/example/test-all-endpoints.sh)
```

Then check the dashboard to see all activity!

## 📊 What You'll See in the Dashboard

- **Incoming Requests** - Every HTTP request with headers, body, and response
- **Outgoing Requests** - All external API calls your app makes
- **Exceptions** - Errors with full stack traces
- **Logs** - Console logs organized by severity level
- **Database Queries** - SQL queries with execution times
- **Dashboard** - Overview statistics of all monitored data

## 🔧 Configuration

```typescript
setupTelescope(app, {
  enabled: true, // Enable/disable Telescope
  path: '/telescope', // Dashboard URL path
  max_entries: 1000, // Max entries to keep in memory
  ignored_paths: ['/health'], // Paths to ignore
  watchers: {
    requests: true, // Monitor HTTP requests
    exceptions: true, // Monitor exceptions
    logs: true, // Monitor console logs
    queries: true, // Monitor database queries
  },
});
```

## 🗺️ Roadmap

We're actively developing new features! Here's what's coming:

- 💾 Data Export (JSON, CSV)
- 🔔 Real-time Alerts & Notifications
- 📈 Advanced Analytics & Reporting
- 🔐 Dashboard Authentication
- 🌍 Multi-Tenancy Support
- 📱 Enhanced Mobile Dashboard
- 🧩 Plugin System for Extensions
- 🔄 Persistent Data Storage

## 🤝 Perfect For

- **Debugging Production Issues** - See exactly what's happening
- **Development & Testing** - Monitor all requests and logs in one place
- **Performance Analysis** - Track database query times
- **API Development** - Monitor request/response flow
- **Error Tracking** - Catch and analyze exceptions

## 💬 Why Telescope for Hono?

If you've used Laravel Telescope, you know how invaluable it is. Hono Telescope brings that same powerful debugging experience to the JavaScript/TypeScript world, with support for:

- Modern Node.js & Bun runtimes
- Popular ORMs (Prisma, Sequelize, MongoDB)
- Multiple database backends
- Full TypeScript support
- Beautiful, responsive UI

## 📖 Documentation

- [GitHub Repository](https://github.com/jubstaaa/hono-telescope)
- [Full Documentation](https://github.com/jubstaaa/hono-telescope#readme)
- [Example Application](https://github.com/jubstaaa/hono-telescope/tree/main/src/example)

## 🐛 Found a Bug?

Report it on [GitHub Issues](https://github.com/jubstaaa/hono-telescope/issues)

## 💡 Have a Feature Request?

Share your ideas on [GitHub Discussions](https://github.com/jubstaaa/hono-telescope/discussions)

## 📝 What's New in v0.1.11

- ✅ Fixed SVG icon bundling in production builds
- ✅ Improved dashboard asset handling
- ✅ Added comprehensive feature roadmap documentation
- ✅ Better TypeScript support for asset imports

## 🙏 Thank You!

A special thank you to all Hono users and the amazing Hono community. Hono Telescope is built for you, by the community.

---

**Made with ❤️ for the Hono community**

**Questions?** Open an issue or discussion on GitHub!  
**Want to contribute?** Check out CONTRIBUTING.md in the repository.
