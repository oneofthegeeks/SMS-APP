# GoTo Connect SMS Sender

A modern, containerized web application for sending SMS messages through GoTo Connect's API. Built with Node.js, Redis, and Docker.

## ✨ Features

- 🔐 **OAuth 2.0 Authentication** - Secure authentication with GoTo Connect
- 📱 **SMS Sending** - Send SMS messages to any phone number
- 📞 **Phone Number Management** - View and manage your authorized phone numbers
- 🏢 **Multi-Account Support** - Switch between different GoTo Connect accounts
- 🐳 **Docker Ready** - Easy deployment with Docker Compose
- 🔄 **Token Management** - Automatic token refresh and storage
- 📊 **Real-time Status** - View SMS capability status for your numbers

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- A GoTo Connect account with API access
- OAuth client credentials from [GoTo Developer Portal](https://developer.goto.com/)

### Installation Options

#### Option 1: Using Docker Hub (Recommended)

1. **Pull the image**
   ```bash
   docker pull oneofthegeeks/goto-sms-sender:latest
   ```

2. **Create a directory and download files**
   ```bash
   mkdir goto-sms-sender && cd goto-sms-sender
   curl -O https://raw.githubusercontent.com/oneofthegeeks/goto-sms-sender/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/oneofthegeeks/goto-sms-sender/main/env.example
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your GoTo Connect credentials
   ```

4. **Start the application**
   ```bash
   docker compose up -d
   ```

#### Option 2: Clone the Repository

1. **Clone the repository**
   ```bash
   git clone https://github.com/oneofthegeeks/goto-sms-sender.git
   cd goto-sms-sender
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your GoTo Connect credentials
   ```

3. **Start the application**
   ```bash
   docker compose up -d
   ```

### Access the Application

- Open http://localhost:8080 in your browser
- Click "Authorize App" to authenticate with GoTo Connect
- Start sending SMS messages!

## 📋 Configuration

### Environment Variables

Copy `env.example` to `.env` and configure the following variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `OAUTH_CLIENT_ID` | Your OAuth client ID from GoTo Developer Portal | `your-client-id` |
| `OAUTH_CLIENT_SECRET` | Your OAuth client secret | `your-client-secret` |
| `OAUTH_REDIRECT_URI` | OAuth redirect URI | `http://localhost:8080/login/oauth2/code/goto` |
| `GOTO_ACCOUNT_KEY` | Your GoTo Connect account key | `your-account-key` |
| `REDIS_URL` | Redis connection URL (default for Docker) | `redis://redis:6379` |

### OAuth Client Setup

1. Visit the [GoTo Developer Portal](https://developer.goto.com/)
2. Create a new OAuth client
3. Set the redirect URI to: `http://localhost:8080/login/oauth2/code/goto`
4. Add the following scopes:
   - `messaging.v1.send`
   - `voice-admin.v1.read`
5. Copy the client ID and secret to your `.env` file

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │   NGINX Proxy   │    │  Node.js App    │
│                 │◄──►│                 │◄──►│                 │
│   (Port 8080)   │    │   (Port 80)     │    │  (Port 5000)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │     Redis       │
                                              │   (Port 6379)   │
                                              └─────────────────┘
```

## 🔧 Development

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp env.example .env
   # Configure your .env file
   ```

3. **Start Redis** (if not using Docker)
   ```bash
   docker run -d -p 6379:6379 redis:alpine
   ```

4. **Run the application**
   ```bash
   npm run dev
   ```

### Docker Development

```bash
# Build and start all services
docker compose up -d

# View logs
docker compose logs -f app

# Stop all services
docker compose down
```

## 🌐 Production Deployment

### Using Docker Compose

1. **Set up your server**
   ```bash
   # Clone the repository
   git clone https://github.com/oneofthegeeks/goto-sms-sender.git
   cd goto-sms-sender
   
   # Configure environment
   cp env.example .env
   nano .env  # Edit with your production values
   ```

2. **Update OAuth redirect URI**
   - Change `OAUTH_REDIRECT_URI` to your domain
   - Update the redirect URI in GoTo Developer Portal

3. **Deploy**
   ```bash
   docker compose up -d
   ```

### Using a Reverse Proxy

For production, you may want to use a reverse proxy like NGINX:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Monitoring & Logs

### View Application Logs

```bash
# All services
docker compose logs

# Specific service
docker compose logs app
docker compose logs nginx
docker compose logs redis

# Follow logs in real-time
docker compose logs -f app
```

### Health Check

The application includes a health check endpoint:
```bash
curl http://localhost:8080/health
```

## 🔄 Updating

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker compose down
docker compose build --no-cache
docker compose up -d
```

## 🛠️ Troubleshooting

### Common Issues

#### Authentication Problems
- ✅ Verify your OAuth credentials in `.env`
- ✅ Check that redirect URI matches GoTo Developer Portal
- ✅ Ensure your account has the required permissions

#### SMS Sending Issues
- ✅ Verify your `GOTO_ACCOUNT_KEY`
- ✅ Check phone number format (E.164: `+18005551234`)
- ✅ Confirm SMS is enabled on your account

#### Container Issues
```bash
# Check container status
docker compose ps

# View container details
docker inspect <container_id>

# Restart specific service
docker compose restart app
```

### Redis Data Management

```bash
# Backup Redis data
docker compose exec redis redis-cli SAVE
docker cp $(docker compose ps -q redis):/data/dump.rdb ./redis-backup.rdb

# Restore Redis data
docker cp ./redis-backup.rdb $(docker compose ps -q redis):/data/dump.rdb
docker compose restart redis
```

## 🔒 Security Considerations

- 🔐 Never commit your `.env` file to version control
- 🔐 Use HTTPS in production environments
- 🔐 Consider setting a Redis password for production
- 🔐 Regularly update Docker images and dependencies
- 🔐 Monitor application logs for suspicious activity

## 📝 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Main SMS interface |
| `GET` | `/authorize` | Start OAuth flow |
| `GET` | `/login/oauth2/code/goto` | OAuth callback |
| `POST` | `/send-sms` | Send SMS message |
| `GET` | `/refresh-numbers` | Refresh phone numbers |
| `GET` | `/health` | Health check |

### SMS API Format

```json
{
  "ownerPhoneNumber": "+18005551234",
  "contactPhoneNumbers": ["+18005559876"],
  "body": "Your message here"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 **Email**: support@yourdomain.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/oneofthegeeks/goto-sms-sender/issues)
- 📖 **Documentation**: [GoTo Connect API Docs](https://developer.goto.com/)

## 🐳 Docker Hub

This project is also available on Docker Hub for easy deployment:

```bash
# Pull the latest image
docker pull oneofthegeeks/goto-sms-sender:latest

# Run with custom environment
docker run -d \
  -p 8080:8080 \
  -e OAUTH_CLIENT_ID=your-client-id \
  -e OAUTH_CLIENT_SECRET=your-client-secret \
  -e GOTO_ACCOUNT_KEY=your-account-key \
  oneofthegeeks/goto-sms-sender:latest
```

### Available Tags

- `latest` - Latest stable release
- `v1.0.0` - Specific version (replace with actual version)
- `main` - Latest from main branch

---

**Made with ❤️ for the GoTo Connect community**
