const { createClient } = require('redis');
const { REDIS_URL } = require('./constants');

class RedisService {
  constructor() {
    this.client = null;
  }

  async connect() {
    try {
      this.client = createClient({
        url: REDIS_URL
      });
      
      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });
      
      this.client.on('connect', () => {
        console.log('Connected to Redis');
      });
      
      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('Failed to connect to Redis:', error.message);
      throw error;
    }
  }

  getClient() {
    if (!this.client) {
      throw new Error('Redis client not initialized. Call connect() first.');
    }
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}

module.exports = new RedisService();