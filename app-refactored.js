// SMS Application - Refactored Version
require('dotenv').config();

const express = require('express');
const redisService = require('./src/config/redis');
const { PORT, HOST } = require('./src/config/constants');

// Middleware
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const { generalLimiter, smsLimiter, securityHeaders, validateStateParam } = require('./src/middleware/security');

// Routes
const indexRoutes = require('./src/routes/index');
const oauthRoutes = require('./src/routes/oauth');
const smsRoutes = require('./src/routes/sms');
const accountRoutes = require('./src/routes/accounts');

class SMSApplication {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(securityHeaders);
    this.app.use(generalLimiter);
    this.app.use(validateStateParam);

    // Basic Express middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRoutes() {
    // Main routes
    this.app.use('/', indexRoutes);
    
    // OAuth routes
    this.app.use('/', oauthRoutes);
    
    // SMS routes with specific rate limiting
    this.app.use('/', smsLimiter, smsRoutes);
    
    // Account management routes
    this.app.use('/', accountRoutes);
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  async start() {
    try {
      // Initialize Redis connection
      await redisService.connect();
      
      // Start the server
      this.app.listen(PORT, HOST, () => {
        console.log(`SMS Application is running on http://${HOST}:${PORT}`);
        console.log('Environment:', process.env.NODE_ENV || 'development');
      });

      // Graceful shutdown handling
      this.setupGracefulShutdown();
    } catch (error) {
      console.error('Failed to start application:', error.message);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
      
      try {
        await redisService.disconnect();
        console.log('Redis connection closed.');
        console.log('Application shut down gracefully.');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error.message);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }
}

// Start the application
const app = new SMSApplication();
app.start().catch(error => {
  console.error('Failed to start SMS application:', error.message);
  process.exit(1);
});

module.exports = app;