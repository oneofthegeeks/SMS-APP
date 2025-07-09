# Contributing to GoTo Connect SMS Sender

Thank you for your interest in contributing to the GoTo Connect SMS Sender! This document provides guidelines for contributing to this project.

## 🤝 How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in the [Issues](https://github.com/oneofthegeeks/goto-sms-sender/issues) section
2. Create a new issue with a clear and descriptive title
3. Include steps to reproduce the bug
4. Add screenshots if applicable
5. Include your environment details (OS, Docker version, etc.)

### Suggesting Features

1. Check if the feature has already been suggested
2. Create a new issue with the "enhancement" label
3. Describe the feature and why it would be useful
4. Include mockups or examples if possible

### Submitting Code Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test your changes thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 🧪 Development Setup

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/oneofthegeeks/goto-sms-sender.git
   cd goto-sms-sender
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp env.example .env
   # Edit .env with your test credentials
   ```

4. **Start Redis** (if not using Docker)
   ```bash
   docker run -d -p 6379:6379 redis:alpine
   ```

5. **Run the application**
   ```bash
   npm run dev
   ```

### Testing

- Test all new features thoroughly
- Ensure the application works with Docker Compose
- Test OAuth flow and SMS sending functionality
- Verify error handling works correctly

## 📝 Code Style Guidelines

### JavaScript/Node.js

- Use consistent indentation (2 spaces)
- Follow ESLint rules if configured
- Use meaningful variable and function names
- Add comments for complex logic
- Use async/await for asynchronous operations

### HTML/CSS

- Use semantic HTML elements
- Keep CSS organized and commented
- Use responsive design principles
- Ensure accessibility standards are met

### Git Commit Messages

- Use clear, descriptive commit messages
- Start with a verb (Add, Fix, Update, etc.)
- Keep the first line under 50 characters
- Add more details in the body if needed

Example:
```
Add health check endpoint

- Add /health endpoint for monitoring
- Return 200 status with "healthy" message
- Include in nginx configuration
```

## 🔒 Security Guidelines

- Never commit sensitive information (API keys, passwords, etc.)
- Use environment variables for configuration
- Validate all user inputs
- Follow OWASP security guidelines
- Test for common vulnerabilities

## 📋 Pull Request Guidelines

1. **Title**: Clear and descriptive
2. **Description**: Explain what the PR does and why
3. **Testing**: Describe how you tested the changes
4. **Screenshots**: Include screenshots for UI changes
5. **Checklist**: Complete the PR template checklist

### PR Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Tested locally
- [ ] Tested with Docker
- [ ] OAuth flow works
- [ ] SMS sending works

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No sensitive data committed
```

## 🏷️ Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `question` - Further information is requested

## 📞 Getting Help

- 📧 **Email**: support@yourdomain.com
- 💬 **Discussions**: [GitHub Discussions](https://github.com/oneofthegeeks/goto-sms-sender/discussions)
- 🐛 **Issues**: [GitHub Issues](https://github.com/oneofthegeeks/goto-sms-sender/issues)

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to the GoTo Connect SMS Sender! 🚀 