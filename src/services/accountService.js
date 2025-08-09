const redisService = require('../config/redis');
const { REDIS_KEYS } = require('../config/constants');

class AccountService {
  async getSavedAccountKeys() {
    try {
      const redisClient = redisService.getClient();
      const accountKeys = await redisClient.get(REDIS_KEYS.ACCOUNT_KEYS);
      return accountKeys ? JSON.parse(accountKeys) : [];
    } catch (error) {
      console.error('Error retrieving account keys:', error.message);
      return [];
    }
  }

  async saveAccountKey(accountKey, accountName) {
    try {
      if (!accountKey) return null;
      
      const redisClient = redisService.getClient();
      let accounts = await this.getSavedAccountKeys();
      
      const existingIndex = accounts.findIndex(acc => acc.key === accountKey);
      
      if (existingIndex >= 0) {
        accounts[existingIndex].name = accountName || accounts[existingIndex].name;
      } else {
        accounts.push({
          key: accountKey,
          name: accountName || `Account ${accounts.length + 1}`,
          dateAdded: new Date().toISOString()
        });
      }
      
      await redisClient.set(REDIS_KEYS.ACCOUNT_KEYS, JSON.stringify(accounts));
      await redisClient.set(REDIS_KEYS.CURRENT_ACCOUNT_KEY, accountKey);
      
      return accounts;
    } catch (error) {
      console.error('Error saving account key:', error.message);
      return await this.getSavedAccountKeys();
    }
  }

  async getCurrentAccountKey() {
    try {
      const redisClient = redisService.getClient();
      const currentKey = await redisClient.get(REDIS_KEYS.CURRENT_ACCOUNT_KEY);
      
      if (currentKey) {
        return currentKey;
      }
      
      const accounts = await this.getSavedAccountKeys();
      
      if (accounts && accounts.length > 0) {
        await redisClient.set(REDIS_KEYS.CURRENT_ACCOUNT_KEY, accounts[0].key);
        return accounts[0].key;
      }
      
      return process.env.GOTO_ACCOUNT_KEY;
    } catch (error) {
      console.error('Error getting current account key:', error.message);
      return process.env.GOTO_ACCOUNT_KEY;
    }
  }

  async setCurrentAccountKey(accountKey) {
    try {
      const redisClient = redisService.getClient();
      await redisClient.set(REDIS_KEYS.CURRENT_ACCOUNT_KEY, accountKey);
      // Clear cached phone numbers when switching accounts
      await redisClient.del(REDIS_KEYS.AUTHORIZED_PHONE_NUMBERS);
      return true;
    } catch (error) {
      console.error('Error setting current account key:', error.message);
      return false;
    }
  }
}

module.exports = new AccountService();