const oauthService = require('./oauthService');
const phoneService = require('./phoneService');
const { GOTO_SMS_ENDPOINT } = require('../config/constants');

class SMSService {
  async sendSMS(ownerPhoneNumber, ownerCountryCode, contactCountryCode, contactPhoneNumber, messageBody) {
    try {
      // Validate input
      if (!messageBody || messageBody.trim().length === 0) {
        throw new Error('Message body is required');
      }

      // Determine the owner phone number (either directly selected or formatted)
      let formattedOwnerPhone = ownerPhoneNumber;
      if (ownerCountryCode) {
        formattedOwnerPhone = phoneService.formatPhoneNumber(ownerCountryCode, ownerPhoneNumber);
      }
      
      // Format the contact phone number
      const formattedContactPhone = phoneService.formatPhoneNumber(contactCountryCode, contactPhoneNumber);
      
      console.log(`Owner phone: ${formattedOwnerPhone}`);
      console.log(`Contact phone: ${formattedContactPhone}`);
      
      // Get access token
      const accessToken = await oauthService.getAccessToken();
      
      if (!accessToken) {
        throw new Error('No valid token found. Please authorize the app first.');
      }

      const payload = {
        ownerPhoneNumber: formattedOwnerPhone,
        contactPhoneNumbers: [formattedContactPhone],
        body: messageBody.trim(),
      };

      console.log('Sending SMS with payload:', JSON.stringify(payload));

      const response = await fetch(GOTO_SMS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please reauthorize the app.');
      }

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Error Response from SMS API:', responseData);
        throw new Error(responseData.message || 'Unknown error occurred while sending SMS');
      }

      return {
        success: true,
        from: formattedOwnerPhone,
        to: formattedContactPhone,
        message: messageBody,
        response: responseData
      };
    } catch (error) {
      console.error('Error sending SMS:', error.message);
      throw error;
    }
  }
}

module.exports = new SMSService();