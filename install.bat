@echo off
setlocal enabledelayedexpansion

echo 🚀 GoTo Connect SMS Sender - Installation Script
echo ================================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first:
    echo    https://docs.docker.com/get-docker/
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first:
    echo    https://docs.docker.com/compose/install/
    pause
    exit /b 1
)

echo ✅ Docker and Docker Compose are installed
echo.

REM Check if .env file exists
if not exist .env (
    echo 📝 Creating .env file from template...
    if exist env.example (
        copy env.example .env >nul
        echo ✅ Created .env file
        echo.
        echo ⚠️  IMPORTANT: Please edit the .env file with your GoTo Connect credentials:
        echo    - OAUTH_CLIENT_ID
        echo    - OAUTH_CLIENT_SECRET
        echo    - GOTO_ACCOUNT_KEY
        echo.
        echo You can edit it now with: notepad .env
        echo.
        pause
    ) else (
        echo ❌ env.example file not found. Please create a .env file manually.
        pause
        exit /b 1
    )
) else (
    echo ✅ .env file already exists
)

REM Build and start the application
echo 🐳 Building and starting the application...
docker compose up -d --build

echo.
echo 🎉 Installation complete!
echo.
echo 📱 Access your SMS Sender at: http://localhost:8080
echo.
echo 📋 Next steps:
echo    1. Open http://localhost:8080 in your browser
echo    2. Click 'Authorize App' to authenticate with GoTo Connect
echo    3. Start sending SMS messages!
echo.
echo 📊 View logs: docker compose logs -f app
echo 🛑 Stop the app: docker compose down
echo.
pause 