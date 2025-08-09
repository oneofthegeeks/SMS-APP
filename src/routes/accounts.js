const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validateAccountInput, validateAccountSelection, sanitizeInput } = require('../middleware/validation');
const accountService = require('../services/accountService');

// Add a new account
router.post('/add-account', sanitizeInput, validateAccountInput, asyncHandler(async (req, res) => {
  const { accountKey, accountName } = req.body;
  
  await accountService.saveAccountKey(accountKey, accountName);
  res.redirect('/');
}));

// Select an account to use
router.post('/select-account', sanitizeInput, validateAccountSelection, asyncHandler(async (req, res) => {
  const { accountKey } = req.body;
  
  await accountService.setCurrentAccountKey(accountKey);
  res.redirect('/');
}));

module.exports = router;