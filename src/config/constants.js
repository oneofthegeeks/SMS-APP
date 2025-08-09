module.exports = {
  // Server configuration
  PORT: process.env.PORT || 5000,
  HOST: '127.0.0.1',
  
  // Redis configuration
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Token expiration times
  OAUTH_STATE_EXPIRY: 300, // 5 minutes
  PHONE_NUMBERS_CACHE_EXPIRY: 86400, // 24 hours
  DEFAULT_TOKEN_EXPIRY: 3600, // 1 hour
  
  // API endpoints
  GOTO_SMS_ENDPOINT: 'https://api.goto.com/messaging/v1/messages',
  GOTO_VOICE_ADMIN_ENDPOINT: 'https://api.goto.com/voice-admin/v1/phone-numbers',
  
  // OAuth configuration
  OAUTH_TOKEN_PATH: '/oauth/token',
  OAUTH_AUTHORIZE_PATH: '/oauth/authorize',
  OAUTH_SCOPES: 'messaging.v1.send voice-admin.v1.read',
  
  // Redis keys
  REDIS_KEYS: {
    ACCESS_TOKEN: 'access_token',
    OAUTH_STATE: 'oauth_state',
    ACCOUNT_KEYS: 'account_keys',
    CURRENT_ACCOUNT_KEY: 'current_account_key',
    AUTHORIZED_PHONE_NUMBERS: 'authorized_phone_numbers'
  },
  
  // Phone number validation
  PHONE_REGEX: /^[0-9]{10}$/,
  
  // Country codes
  COUNTRY_CODES: [
    { code: '1', name: 'US/Canada (+1)' },
    { code: '44', name: 'UK (+44)' },
    { code: '61', name: 'Australia (+61)' },
    { code: '33', name: 'France (+33)' },
    { code: '49', name: 'Germany (+49)' },
    { code: '81', name: 'Japan (+81)' },
    { code: '86', name: 'China (+86)' }
  ]
};