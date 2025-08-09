const express = require('express');
const router = express.Router();
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const oauthService = require('../services/oauthService');
const phoneService = require('../services/phoneService');
const { generateAuthSuccessPage } = require('../templates/smsForm');

// Redirect user for OAuth authorization
router.get('/authorize', asyncHandler(async (req, res) => {
  const authorizationUri = await oauthService.generateAuthorizationUrl();
  res.redirect(authorizationUri);
}));

// Handle OAuth callback
router.get('/login/oauth2/code/goto', asyncHandler(async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    throw new AppError('Missing authorization code or state', 403);
  }

  // Verify the state parameter
  const isValidState = await oauthService.validateState(state);
  if (!isValidState) {
    throw new AppError('Invalid or expired state parameter', 403);
  }

  // Exchange code for token
  await oauthService.exchangeCodeForToken(code);
  
  // Fetch authorized phone numbers after successful authorization
  const phoneNumbers = await phoneService.fetchAuthorizedPhoneNumbers();
  console.log('Fetched phone numbers after authorization:', phoneNumbers);
  
  res.status(200).send(generateAuthSuccessPage());
}));

module.exports = router;