const { AuthorizationCode } = require('simple-oauth2');
const crypto = require('crypto');
const redisService = require('../config/redis');
const { REDIS_KEYS, OAUTH_STATE_EXPIRY, DEFAULT_TOKEN_EXPIRY, OAUTH_TOKEN_PATH, OAUTH_AUTHORIZE_PATH, OAUTH_SCOPES } = require('../config/constants');

class OAuthService {
  constructor() {
    this.oauthClient = new AuthorizationCode({
      client: {
        id: process.env.OAUTH_CLIENT_ID,
        secret: process.env.OAUTH_CLIENT_SECRET,
      },
      auth: {
        tokenHost: process.env.OAUTH_SERVICE_URL,
        tokenPath: OAUTH_TOKEN_PATH,
        authorizePath: OAUTH_AUTHORIZE_PATH,
      },
    });
  }

  async generateAuthorizationUrl() {
    try {
      const state = crypto.randomBytes(15).toString('hex');
      const redisClient = redisService.getClient();
      
      await redisClient.set(`${REDIS_KEYS.OAUTH_STATE}:${state}`, 'pending', { 
        EX: OAUTH_STATE_EXPIRY 
      });
      
      const authorizationUri = this.oauthClient.authorizeURL({
        redirect_uri: process.env.OAUTH_REDIRECT_URI,
        scope: OAUTH_SCOPES,
        state: state,
      });

      console.log('Authorization URL:', authorizationUri);
      return authorizationUri;
    } catch (error) {
      console.error('Error generating authorization URL:', error.message);
      throw error;
    }
  }

  async validateState(state) {
    try {
      const redisClient = redisService.getClient();
      const storedState = await redisClient.get(`${REDIS_KEYS.OAUTH_STATE}:${state}`);
      
      if (storedState) {
        await redisClient.del(`${REDIS_KEYS.OAUTH_STATE}:${state}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error validating state:', error.message);
      return false;
    }
  }

  async exchangeCodeForToken(code) {
    try {
      const tokenParams = { 
        code, 
        redirect_uri: process.env.OAUTH_REDIRECT_URI 
      };
      
      const tokenResponse = await this.oauthClient.getToken(tokenParams);
      const accessToken = tokenResponse.token.access_token;
      const expiresIn = tokenResponse.token.expires_in || DEFAULT_TOKEN_EXPIRY;
      
      const redisClient = redisService.getClient();
      await redisClient.set(REDIS_KEYS.ACCESS_TOKEN, accessToken, {
        EX: expiresIn
      });
      
      console.log('Access token stored in Redis');
      return accessToken;
    } catch (error) {
      console.error('Error exchanging authorization code:', error.message);
      throw error;
    }
  }

  async getAccessToken() {
    try {
      const redisClient = redisService.getClient();
      return await redisClient.get(REDIS_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error.message);
      return null;
    }
  }

  async isTokenValid() {
    const token = await this.getAccessToken();
    return !!token;
  }
}

module.exports = new OAuthService();