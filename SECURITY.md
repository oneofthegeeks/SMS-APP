# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability in the GoTo Connect SMS Sender, please follow these steps:

### 🔒 Private Disclosure

**DO NOT** create a public GitHub issue for security vulnerabilities. Instead, please report them privately to:

- 📧 **Email**: security@yourdomain.com
- 🔐 **PGP Key**: [Security PGP Key](https://yourdomain.com/security.asc)

### 📋 What to Include

When reporting a vulnerability, please include:

1. **Description** - Clear description of the vulnerability
2. **Steps to Reproduce** - Detailed steps to reproduce the issue
3. **Impact** - Potential impact of the vulnerability
4. **Environment** - Your environment details (OS, Docker version, etc.)
5. **Proof of Concept** - If possible, include a proof of concept
6. **Suggested Fix** - If you have suggestions for fixing the issue

### ⏱️ Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 1 week
- **Resolution**: As quickly as possible, typically within 30 days

### 🏆 Recognition

Security researchers who responsibly disclose vulnerabilities will be:

- Listed in our [Security Hall of Fame](https://github.com/oneofthegeeks/goto-sms-sender/security/advisories)
- Given credit in our security advisories
- Offered a security researcher badge

### 🛡️ Security Best Practices

To help keep this project secure:

1. **Keep Dependencies Updated**
   ```bash
   npm audit
   docker compose pull
   ```

2. **Use Environment Variables**
   - Never commit sensitive data
   - Use `.env` files for configuration
   - Rotate credentials regularly

3. **Monitor Logs**
   ```bash
   docker compose logs -f app
   ```

4. **Regular Security Audits**
   - Run security scans
   - Review access controls
   - Monitor for suspicious activity

### 🔍 Security Checklist

Before deploying to production:

- [ ] All dependencies are up to date
- [ ] Environment variables are properly configured
- [ ] HTTPS is enabled in production
- [ ] Redis is properly secured
- [ ] Access logs are being monitored
- [ ] Regular backups are configured
- [ ] Security headers are implemented

### 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Redis Security](https://redis.io/topics/security)

---

Thank you for helping keep the GoTo Connect SMS Sender secure! 🔒 