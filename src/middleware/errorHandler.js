class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message } = err;

  // Log error for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Invalid input data';
  }

  if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Authentication required';
  }

  // Don't expose internal errors in production
  if (!err.isOperational && process.env.NODE_ENV === 'production') {
    message = 'Something went wrong';
  }

  // Send error response
  if (req.accepts('html')) {
    // For HTML requests, send a user-friendly error page
    res.status(statusCode).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error ${statusCode}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; }
          .error { color: #f44336; }
          a { display: inline-block; margin-top: 15px; text-decoration: none; color: #4CAF50; }
        </style>
      </head>
      <body>
        <h1 class="error">Error ${statusCode}</h1>
        <p>${message}</p>
        <a href="/">Go back to home</a>
      </body>
      </html>
    `);
  } else {
    // For API requests, send JSON
    res.status(statusCode).json({
      success: false,
      error: {
        message,
        statusCode,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      }
    });
  }
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  notFoundHandler
};