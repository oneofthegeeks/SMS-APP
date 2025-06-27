# GoTo Connect SMS Sender

A containerized application for sending SMS messages through GoTo Connect's API.

---

## 🚀 Deployment Instructions

These instructions will guide you through deploying the GoTo Connect SMS Sender application using Docker Compose.

### ✅ Prerequisites

- Docker and Docker Compose installed on your server
- A GoTo Connect account with API access
- A valid OAuth client registered with GoTo Connect
- (Optional) A domain name pointed to your server for production use

---

## ⚡ Quick Setup

### 1. Create a deployment directory

<pre><code>mkdir -p /opt/goto-sms
cd /opt/goto-sms
</code></pre>

### 2. Create a `docker-compose.yml` file

Create the file:

<pre><code>nano docker-compose.yml
</code></pre>

Paste the following content:

<pre><code>

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    expose:
      - "5000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - OAUTH_SERVICE_URL=${OAUTH_SERVICE_URL}
      - OAUTH_CLIENT_ID=${OAUTH_CLIENT_ID}
      - OAUTH_CLIENT_SECRET=${OAUTH_CLIENT_SECRET}
      - OAUTH_REDIRECT_URI=${OAUTH_REDIRECT_URI}
      - GOTO_ACCOUNT_KEY=${GOTO_ACCOUNT_KEY}
    depends_on:
      - redis
    networks:
      - app-network

  redis:
    image: redis:alpine
    restart: always
    volumes:
      - redis-data:/data
    networks:
      - app-network

  nginx:
    build:
      context: .
      dockerfile: nginx.Dockerfile
    restart: always
    ports:
      - "8080:80"
    volumes:
      - nginx-logs:/var/log/nginx
    depends_on:
      - app
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  redis-data:
  nginx-logs:
</code></pre>

---

### 3. Create a `.env` file

<pre><code>nano .env
</code></pre>

Add your GoTo Connect credentials:

<pre><code># GoTo Connect OAuth Configuration
OAUTH_SERVICE_URL=https://authentication.logmeininc.com
OAUTH_CLIENT_ID=your-client-id-here
OAUTH_CLIENT_SECRET=your-client-secret-here
OAUTH_REDIRECT_URI=http://your-domain.com/login/oauth2/code/goto
# For local testing: http://localhost:8080/login/oauth2/code/goto

# GoTo Connect Account Key
GOTO_ACCOUNT_KEY=your-account-key-here
</code></pre>

---

### 4. Deploy the application

<pre><code>docker compose up -d
</code></pre>

---

## 🌐 Access the Application

- **Local**: http://localhost:8080  
- **Server**: http://your-server-ip:8080

---

## 🌍 Configuring Domain Access

### Option 1: NGINX Proxy Manager

1. Log in to NGINX Proxy Manager
2. Create a new Proxy Host:
   - **Domain**: your-domain.com
   - **Scheme**: http
   - **Forward Hostname/IP**: your server IP
   - **Forward Port**: 8080
   - **SSL**: Enable (use Let's Encrypt)

### Option 2: Standard NGINX Reverse Proxy

<pre><code>server {
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
</code></pre>

---

## 🔐 OAuth Client Setup

1. Log in to the [GoTo Developer Portal](https://developer.goto.com/)
2. Navigate to **OAuth Clients**
3. Set Redirect URIs:
   - **Production**: `https://your-domain.com/login/oauth2/code/goto`
   - **Development**: `http://localhost:8080/login/oauth2/code/goto`
4. Scopes:
   - `messaging.v1.send`
   - `voice-admin.v1.read`

---

## 🔄 Updating the Application

<pre><code>cd /opt/goto-sms
docker compose pull
docker compose build --no-cache
docker compose up -d
</code></pre>

---

## 📜 Viewing Logs

<pre><code># App logs
docker compose logs app

# NGINX logs
docker compose logs nginx

# Redis logs
docker compose logs redis

# Follow logs in real-time
docker compose logs -f app
</code></pre>

---

## 🛠️ Troubleshooting

### Authentication Issues

- Double-check your OAuth credentials in `.env`
- Make sure the Redirect URI matches what's in the GoTo Developer Portal
- Confirm your account has the correct permissions

### SMS Sending Issues

- Verify your `GOTO_ACCOUNT_KEY`
- Ensure phone numbers are in E.164 format (e.g. `+18005551234`)
- Check if SMS functionality is enabled on your account

### Container Issues

<pre><code># Check container status
docker compose ps

# View container details
docker inspect &lt;container_id&gt;
</code></pre>

---

## 🧱 Architecture

This application consists of:

- **Node.js App**: Handles API and front-end
- **Redis**: Stores tokens and message data
- **NGINX**: Reverse proxy and static server

---

## 💾 Data Persistence

Redis data is stored in a Docker volume.

### Backup Redis:

<pre><code>docker compose exec redis redis-cli SAVE
docker cp $(docker compose ps -q redis):/data/dump.rdb ./redis-backup.rdb
</code></pre>

### Restore Redis:

<pre><code>docker cp ./redis-backup.rdb $(docker compose ps -q redis):/data/dump.rdb
docker compose restart redis
</code></pre>

---

## 🔒 Security Notes

- Never commit your `.env` file to version control
- Consider setting a Redis password in production
- Always use HTTPS for live environments
- Regularly update Docker images and dependencies

---

## 📄 License

MIT License
