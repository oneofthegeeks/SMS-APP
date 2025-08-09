const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Rate limiting configuration
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// General rate limiter
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later.'
);

// Strict rate limiter for sensitive endpoints
const strictLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs
  'Too many attempts from this IP, please try again later.'
);

// SMS sending rate limiter
const smsLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10, // limit each IP to 10 SMS per minute
  'Too many SMS requests from this IP, please try again later.'
);

// Basic security headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
});

// CSRF-like protection for state parameter in OAuth
const validateStateParam = (req, res, next) => {
  if (req.path === '/login/oauth2/code/goto') {
    const { state } = req.query;
    if (!state || typeof state !== 'string' || state.length !== 30) {
      return res.status(403).send('<h1>Error: Invalid state parameter format</h1>');
    }
  }
  next();
};

module.exports = {
  generalLimiter,
  strictLimiter,
  smsLimiter,
  securityHeaders,
  validateStateParam
};