# Security Policy

## Reporting a Vulnerability

Security is very important to us. If you have discovered a security vulnerability in Hono Telescope, we appreciate your help in disclosing it to us in a responsible manner.

### How to Report

Please **do not** open a public GitHub issue for security vulnerabilities. Instead:

1. Email your report to the maintainers
2. Include details about:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if you have one)

### What to Expect

- Acknowledgment of your report within 48 hours
- Regular updates about the progress
- Credit for the discovery (if desired)
- A reasonable timeline for a fix and release

## Supported Versions

| Version       | Supported |
| ------------- | --------- |
| 0.1.3         | ✅        |
| 0.1.0 - 0.1.2 | ⚠️        |
| < 0.1.0       | ❌        |

We recommend always using the latest version of Hono Telescope.

## Security Best Practices

When using Hono Telescope:

### 1. **Production Considerations**

- Disable Telescope dashboard in production or behind authentication
- Be cautious about what data is logged (avoid sensitive information)
- Use appropriate storage limits to prevent memory issues

### 2. **Data Privacy**

- Telescope stores request data in memory by default
- Sensitive data (tokens, passwords) can appear in logs - be aware
- Consider using the ignore paths feature to exclude sensitive endpoints

### 3. **Dependencies**

- Keep Hono Telescope and its dependencies updated
- Monitor security advisories for dependencies
- Use `npm audit` regularly

### 4. **Access Control**

- Restrict access to the Telescope dashboard in your application
- Use authentication middleware before Telescope routes
- Never expose the dashboard to untrusted networks

## Example Secure Setup

```typescript
import { Hono } from 'hono';
import { setupTelescope } from 'hono-telescope';
import { auth } from './middleware/auth'; // Your auth middleware

const app = new Hono();

// Setup Telescope with ignored paths
setupTelescope(app, {
  path: '/telescope',
  ignored_paths: ['/api/auth/login', '/api/auth/register', '/api/users/password'],
  max_entries: 500, // Limit memory usage
});

// Protect Telescope dashboard
app.use('/telescope*', auth({ role: 'admin' }));

export default app;
```

## Known Limitations

- Data is stored in memory and lost on restart
- No built-in encryption for stored data
- Dashboard authentication must be implemented by the user
- Not suitable for applications handling highly sensitive data

## Disclosure Timeline

We follow a 90-day disclosure timeline for security vulnerabilities:

1. **Day 0**: Report received
2. **Day 30**: Patch development begins (if not already started)
3. **Day 60**: Fix should be ready for release
4. **Day 90**: Public disclosure if fix is released, or vulnerability details will be published

## Security Updates

- Security fixes are released as patch versions (0.0.x)
- Critical vulnerabilities may trigger immediate releases
- Users are encouraged to update regularly

## Dependencies Security

We use the following practices for dependencies:

- Regular `npm audit` checks
- Automated dependency updates via Dependabot
- Security scanning for known vulnerabilities
- Minimal dependencies to reduce attack surface

## Acknowledgments

We appreciate the security research community and responsible vulnerability disclosure. Security researchers who report vulnerabilities will be acknowledged (if they wish).

## Questions?

If you have questions about security, please reach out to the maintainers through GitHub discussions.
