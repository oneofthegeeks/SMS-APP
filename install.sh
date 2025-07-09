#!/bin/bash

# GoTo Connect SMS Sender - Installation Script
# This script helps you set up the SMS sender application

set -e

echo "🚀 GoTo Connect SMS Sender - Installation Script"
echo "================================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    if [ -f env.example ]; then
        cp env.example .env
        echo "✅ Created .env file"
        echo ""
        echo "⚠️  IMPORTANT: Please edit the .env file with your GoTo Connect credentials:"
        echo "   - OAUTH_CLIENT_ID"
        echo "   - OAUTH_CLIENT_SECRET"
        echo "   - GOTO_ACCOUNT_KEY"
        echo ""
        echo "You can edit it now with: nano .env"
        echo ""
        read -p "Press Enter when you've configured the .env file..."
    else
        echo "❌ env.example file not found. Please create a .env file manually."
        exit 1
    fi
else
    echo "✅ .env file already exists"
fi

# Build and start the application
echo "🐳 Building and starting the application..."
docker compose up -d --build

echo ""
echo "🎉 Installation complete!"
echo ""
echo "📱 Access your SMS Sender at: http://localhost:8080"
echo ""
echo "📋 Next steps:"
echo "   1. Open http://localhost:8080 in your browser"
echo "   2. Click 'Authorize App' to authenticate with GoTo Connect"
echo "   3. Start sending SMS messages!"
echo ""
echo "📊 View logs: docker compose logs -f app"
echo "🛑 Stop the app: docker compose down"
echo "" 