const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const oauthService = require('../services/oauthService');
const phoneService = require('../services/phoneService');
const accountService = require('../services/accountService');
const { generateSMSForm } = require('../templates/smsForm');

// Main SMS form page
router.get('/', asyncHandler(async (req, res) => {
  // Check if we have a valid access token first
  const isTokenValid = await oauthService.isTokenValid();
  
  if (!isTokenValid) {
    console.log('No valid access token found. Redirecting to authorization page.');
    return res.redirect('/authorize');
  }
  
  // Get all required data in parallel
  const [authorizedNumbers, accounts, currentAccountKey] = await Promise.all([
    phoneService.getAuthorizedPhoneNumbers(),
    accountService.getSavedAccountKeys(),
    accountService.getCurrentAccountKey()
  ]);

  console.log('Authorized numbers for dropdown:', authorizedNumbers);
  console.log('Number of authorized numbers:', authorizedNumbers?.length || 0);
  
  // Count SMS-enabled numbers
  const smsEnabledNumbers = authorizedNumbers.filter(item => item.smsEnabled);
  console.log('Number of SMS-enabled numbers:', smsEnabledNumbers.length);
  
  const htmlContent = generateSMSForm({
    accounts,
    currentAccountKey,
    authorizedNumbers,
    smsEnabledNumbers
  });

  res.send(htmlContent);
}));

// Refresh phone numbers endpoint
router.get('/refresh-numbers', asyncHandler(async (req, res) => {
  const numbers = await phoneService.refreshPhoneNumbers();
  console.log('Refreshed phone numbers:', numbers);
  res.redirect('/');
}));

module.exports = router;