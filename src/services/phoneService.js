const redisService = require('../config/redis');
const accountService = require('./accountService');
const { REDIS_KEYS, GOTO_VOICE_ADMIN_ENDPOINT, PHONE_NUMBERS_CACHE_EXPIRY } = require('../config/constants');

class PhoneService {
  formatPhoneNumber(countryCode, phoneNumber) {
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    return `+${countryCode}${digitsOnly}`;
  }

  async fetchAuthorizedPhoneNumbers() {
    try {
      const redisClient = redisService.getClient();
      const accessToken = await redisClient.get(REDIS_KEYS.ACCESS_TOKEN);
      const accountKey = await accountService.getCurrentAccountKey();
      
      if (!accessToken) {
        console.log('No access token available');
        return [];
      }
      
      if (!accountKey) {
        console.log('No account key available');
        return [];
      }
      
      const phoneNumbersEndpoint = `${GOTO_VOICE_ADMIN_ENDPOINT}?accountKey=${accountKey}`;
      
      console.log('Fetching phone numbers from API...');
      console.log('Using account key:', accountKey);
      
      const response = await fetch(phoneNumbersEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        console.error(`Error fetching phone numbers: ${response.status}`);
        const errorText = await response.text();
        console.error('Response:', errorText);
        return [];
      }
      
      const data = await response.json();
      console.log('API Response:', JSON.stringify(data, null, 2));
      
      let phoneNumbersWithDetails = [];
      
      if (data && Array.isArray(data.items)) {
        phoneNumbersWithDetails = data.items
          .filter(item => item.number)
          .map(item => ({
            number: item.number,
            callerIdName: item.callerIdName || item.name || '',
            name: item.name || '',
            smsEnabled: item.smsEnabled === true || item.smsEnabled === 'true',
            status: item.status || ''
          }));
      }
      
      console.log('Extracted phone numbers with details:', phoneNumbersWithDetails);
      
      if (phoneNumbersWithDetails.length > 0) {
        await redisClient.set(
          REDIS_KEYS.AUTHORIZED_PHONE_NUMBERS, 
          JSON.stringify(phoneNumbersWithDetails), 
          { EX: PHONE_NUMBERS_CACHE_EXPIRY }
        );
      }
      
      return phoneNumbersWithDetails;
    } catch (error) {
      console.error('Error fetching authorized phone numbers:', error.message);
      return [];
    }
  }

  async getAuthorizedPhoneNumbers() {
    try {
      const redisClient = redisService.getClient();
      const cachedNumbers = await redisClient.get(REDIS_KEYS.AUTHORIZED_PHONE_NUMBERS);
      
      if (cachedNumbers) {
        try {
          const numbers = JSON.parse(cachedNumbers);
          console.log('Using cached phone numbers:', numbers);
          return numbers;
        } catch (e) {
          console.error('Error parsing cached phone numbers:', e.message);
        }
      }
      
      return await this.fetchAuthorizedPhoneNumbers();
    } catch (error) {
      console.error('Error getting authorized phone numbers:', error.message);
      return [];
    }
  }

  async refreshPhoneNumbers() {
    try {
      const redisClient = redisService.getClient();
      await redisClient.del(REDIS_KEYS.AUTHORIZED_PHONE_NUMBERS);
      return await this.fetchAuthorizedPhoneNumbers();
    } catch (error) {
      console.error('Error refreshing phone numbers:', error.message);
      return [];
    }
  }
}

module.exports = new PhoneService();