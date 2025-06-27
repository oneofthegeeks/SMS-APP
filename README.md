GoTo Connect SMS Sender
A containerized application for sending SMS messages through GoTo Connect's API.

Deployment Instructions
These instructions will guide you through deploying the GoTo Connect SMS Sender application using Docker Compose, pulling directly from this GitHub repository.

Prerequisites
A server with Docker and Docker Compose installed
A GoTo Connect account with API access
A valid OAuth client registered with GoTo Connect
A domain name pointed to your server (optional, for production use)
Quick Setup
Create a deployment directory:
bash

Collapse
Save
Copy
1
2
mkdir -p /opt/goto-sms
cd /opt/goto-sms
Create a docker-compose.yml file:
bash

Collapse
Save
Copy
1
nano docker-compose.yml
Paste the following content:

yaml

Collapse
Save
Copy
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
⌄
version: '3.8'

services:
  app:
    build:
      context: https://github.com/yourusername/goto-sms-sender.git#main
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
      context: https://github.com/yourusername/goto-sms-sender.git#main
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
Note: Replace yourusername/goto-sms-sender.git with the actual GitHub repository URL. 

Create an environment file:
bash

Collapse
Save
Copy
1
nano .env
Add your GoTo Connect credentials:


Collapse

Run
Save
Copy
1
2
3
4
5
6
7
8
9
# GoTo Connect OAuth Configuration
OAUTH_SERVICE_URL=https://authentication.logmeininc.com
OAUTH_CLIENT_ID=your-client-id-here
OAUTH_CLIENT_SECRET=your-client-secret-here
OAUTH_REDIRECT_URI=http://your-domain.com/login/oauth2/code/goto
# or for local testing: http://localhost:8080/login/oauth2/code/goto

# GoTo Connect Account Key
GOTO_ACCOUNT_KEY=your-account-key-here
Deploy the application:
bash

Collapse
Save
Copy
1
docker compose up -d
Access the application:
If you're running it locally: http://localhost:8080
If you're running it on a server: http://your-server-ip:8080
Configuring Domain Access
Option 1: Using NGINX Proxy Manager
If you're using NGINX Proxy Manager:

Log in to your NGINX Proxy Manager
Create a new Proxy Host:
Domain: your-domain.com
Scheme: http
Forward Hostname/IP: Your server IP
Forward Port: 8080
Enable SSL: Yes (using Let's Encrypt)
Option 2: Using a Reverse Proxy
If you're using a standard NGINX reverse proxy, create a site configuration:

nginx

Collapse
Save
Copy
1
2
3
4
5
6
7
8
9
10
11
12
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
OAuth Client Setup
Log in to the GoTo Connect Developer Portal
Navigate to OAuth Clients and create or edit your client
Ensure the Redirect URI matches your environment:
Production: https://your-domain.com/login/oauth2/code/goto
Development: http://localhost:8080/login/oauth2/code/goto
Include the scopes: messaging.v1.send and voice-admin.v1.read
Updating the Application
To update to the latest version:

bash

Collapse
Save
Copy
1
2
3
4
cd /opt/goto-sms
docker compose pull
docker compose build --no-cache
docker compose up -d
Checking Logs
To view application logs:

bash

Collapse
Save
Copy
1
2
3
4
5
6
7
8
9
10
11
# App logs
docker compose logs app

# NGINX logs
docker compose logs nginx

# Redis logs
docker compose logs redis

# Follow logs in real-time
docker compose logs -f app
Troubleshooting
Authentication Issues
If you're having trouble authenticating:

Verify your OAuth client credentials in the .env file
Ensure the redirect URI exactly matches what's configured in the GoTo Developer Portal
Check that your account has the necessary permissions
SMS Sending Issues
If SMS messages aren't sending:

Verify your account key is correct
Ensure the phone numbers are in E.164 format (e.g., +18005551234)
Check that your account has SMS capabilities enabled
Container Issues
If containers aren't starting:

bash

Collapse
Save
Copy
1
2
3
4
5
# Check container status
docker compose ps

# View detailed container information
docker inspect <container_id>
Architecture
This application consists of three containerized services:

Node.js Application: Handles the web interface and API interactions
Redis: Stores authentication tokens and phone number information
NGINX: Serves as a web server and reverse proxy
Data Persistence
Redis data is stored in a Docker volume. To back up this data:

bash

Collapse
Save
Copy
1
2
3
4
5
6
7
# Create a backup
docker compose exec redis redis-cli SAVE
docker cp $(docker compose ps -q redis):/data/dump.rdb ./redis-backup.rdb

# Restore from backup
docker cp ./redis-backup.rdb $(docker compose ps -q redis):/data/dump.rdb
docker compose restart redis
Security Notes
Keep your .env file secure and never commit it to source control
Consider setting up a Redis password for production deployments
Use HTTPS in production environments
Regularly update your Docker images and dependencies
License
MIT License