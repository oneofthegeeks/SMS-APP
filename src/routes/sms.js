const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validateSMSInput, sanitizeInput } = require('../middleware/validation');
const smsService = require('../services/smsService');
const { generateSuccessPage } = require('../templates/smsForm');

// Handle SMS submission
router.post('/send-sms', sanitizeInput, validateSMSInput, asyncHandler(async (req, res) => {
  const { 
    ownerPhoneNumber, 
    ownerCountryCode,
    contactCountryCode, 
    contactPhoneNumber, 
    messageBody 
  } = req.body;

  const result = await smsService.sendSMS(
    ownerPhoneNumber, 
    ownerCountryCode,
    contactCountryCode, 
    contactPhoneNumber, 
    messageBody
  );

  const htmlContent = generateSuccessPage({
    from: result.from,
    to: result.to,
    message: result.message
  });

  res.status(201).send(htmlContent);
}));

module.exports = router;