const { AppError } = require('./errorHandler');
const { PHONE_REGEX } = require('../config/constants');

const validateSMSInput = (req, res, next) => {
  const { 
    ownerPhoneNumber, 
    ownerCountryCode,
    contactCountryCode, 
    contactPhoneNumber, 
    messageBody 
  } = req.body;

  const errors = [];

  // Validate message body
  if (!messageBody || typeof messageBody !== 'string' || messageBody.trim().length === 0) {
    errors.push('Message body is required and cannot be empty');
  }

  if (messageBody && messageBody.length > 1600) {
    errors.push('Message body cannot exceed 1600 characters');
  }

  // Validate contact phone number
  if (!contactPhoneNumber || typeof contactPhoneNumber !== 'string') {
    errors.push('Contact phone number is required');
  } else if (!PHONE_REGEX.test(contactPhoneNumber.replace(/\D/g, ''))) {
    errors.push('Contact phone number must be a valid 10-digit number');
  }

  if (!contactCountryCode || !/^\d{1,3}$/.test(contactCountryCode)) {
    errors.push('Valid contact country code is required');
  }

  // Validate owner phone number (if manual entry)
  if (ownerCountryCode) {
    if (!ownerPhoneNumber || typeof ownerPhoneNumber !== 'string') {
      errors.push('Owner phone number is required');
    } else if (!PHONE_REGEX.test(ownerPhoneNumber.replace(/\D/g, ''))) {
      errors.push('Owner phone number must be a valid 10-digit number');
    }

    if (!/^\d{1,3}$/.test(ownerCountryCode)) {
      errors.push('Valid owner country code is required');
    }
  } else if (!ownerPhoneNumber) {
    errors.push('Owner phone number is required');
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400);
  }

  next();
};

const validateAccountInput = (req, res, next) => {
  const { accountKey, accountName } = req.body;
  const errors = [];

  if (!accountKey || typeof accountKey !== 'string' || accountKey.trim().length === 0) {
    errors.push('Account key is required and cannot be empty');
  }

  if (accountName && typeof accountName !== 'string') {
    errors.push('Account name must be a string');
  }

  if (accountName && accountName.length > 100) {
    errors.push('Account name cannot exceed 100 characters');
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400);
  }

  next();
};

const validateAccountSelection = (req, res, next) => {
  const { accountKey } = req.body;

  if (!accountKey || typeof accountKey !== 'string' || accountKey.trim().length === 0) {
    throw new AppError('Account key is required for account selection', 400);
  }

  next();
};

const sanitizeInput = (req, res, next) => {
  // Sanitize string inputs by trimming whitespace
  for (const key in req.body) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = req.body[key].trim();
    }
  }
  next();
};

module.exports = {
  validateSMSInput,
  validateAccountInput,
  validateAccountSelection,
  sanitizeInput
};