// Test setup file for Jest
// This file configures the testing environment

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.OAUTH_CLIENT_ID = 'test-client-id';
process.env.OAUTH_CLIENT_SECRET = 'test-client-secret';
process.env.OAUTH_SERVICE_URL = 'https://oauth.example.com';
process.env.OAUTH_REDIRECT_URI = 'http://localhost:5000/callback';
process.env.GOTO_ACCOUNT_KEY = 'test-account-key';

// Global test utilities
global.createMockRequest = (body = {}, query = {}, params = {}) => ({
  body,
  query,
  params,
  originalUrl: '/test',
  method: 'GET',
  ip: '127.0.0.1',
  get: jest.fn().mockReturnValue('test-user-agent')
});

global.createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    accepts: jest.fn().mockReturnValue('html')
  };
  return res;
};

// Silence console.log in tests unless explicitly testing logging
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Clean up after tests
afterEach(() => {
  jest.clearAllMocks();
});