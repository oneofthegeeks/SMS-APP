// Example unit tests for accountService
// Note: This requires installing jest and setting up test environment

const accountService = require('../../services/accountService');
const redisService = require('../../config/redis');

// Mock Redis client
jest.mock('../../config/redis');

describe('AccountService', () => {
  let mockRedisClient;

  beforeEach(() => {
    mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn()
    };
    redisService.getClient.mockReturnValue(mockRedisClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSavedAccountKeys', () => {
    it('should return empty array when no accounts are saved', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await accountService.getSavedAccountKeys();

      expect(result).toEqual([]);
      expect(mockRedisClient.get).toHaveBeenCalledWith('account_keys');
    });

    it('should return parsed accounts when they exist', async () => {
      const mockAccounts = [
        { key: 'test-key-1', name: 'Test Account 1', dateAdded: '2023-01-01' }
      ];
      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockAccounts));

      const result = await accountService.getSavedAccountKeys();

      expect(result).toEqual(mockAccounts);
    });

    it('should return empty array on Redis error', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await accountService.getSavedAccountKeys();

      expect(result).toEqual([]);
    });
  });

  describe('saveAccountKey', () => {
    it('should return null if no account key provided', async () => {
      const result = await accountService.saveAccountKey(null, 'Test');

      expect(result).toBeNull();
      expect(mockRedisClient.set).not.toHaveBeenCalled();
    });

    it('should add new account key', async () => {
      mockRedisClient.get.mockResolvedValue(null); // No existing accounts
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await accountService.saveAccountKey('new-key', 'New Account');

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'account_keys',
        expect.stringContaining('new-key')
      );
      expect(mockRedisClient.set).toHaveBeenCalledWith('current_account_key', 'new-key');
    });

    it('should update existing account name', async () => {
      const existingAccounts = [
        { key: 'existing-key', name: 'Old Name', dateAdded: '2023-01-01' }
      ];
      mockRedisClient.get.mockResolvedValue(JSON.stringify(existingAccounts));
      mockRedisClient.set.mockResolvedValue('OK');

      await accountService.saveAccountKey('existing-key', 'Updated Name');

      const setCall = mockRedisClient.set.mock.calls.find(call => 
        call[0] === 'account_keys'
      );
      const savedData = JSON.parse(setCall[1]);
      
      expect(savedData[0].name).toBe('Updated Name');
    });
  });

  describe('getCurrentAccountKey', () => {
    it('should return current key if set', async () => {
      mockRedisClient.get.mockResolvedValue('current-key');

      const result = await accountService.getCurrentAccountKey();

      expect(result).toBe('current-key');
      expect(mockRedisClient.get).toHaveBeenCalledWith('current_account_key');
    });

    it('should return first saved account key if no current key', async () => {
      const mockAccounts = [
        { key: 'first-key', name: 'First Account' }
      ];
      mockRedisClient.get
        .mockResolvedValueOnce(null) // No current key
        .mockResolvedValueOnce(JSON.stringify(mockAccounts)); // Saved accounts
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await accountService.getCurrentAccountKey();

      expect(result).toBe('first-key');
      expect(mockRedisClient.set).toHaveBeenCalledWith('current_account_key', 'first-key');
    });

    it('should return environment variable if no saved accounts', async () => {
      process.env.GOTO_ACCOUNT_KEY = 'env-key';
      mockRedisClient.get
        .mockResolvedValueOnce(null) // No current key
        .mockResolvedValueOnce(null); // No saved accounts

      const result = await accountService.getCurrentAccountKey();

      expect(result).toBe('env-key');
    });
  });

  describe('setCurrentAccountKey', () => {
    it('should set current account key and clear phone numbers cache', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.del.mockResolvedValue(1);

      const result = await accountService.setCurrentAccountKey('test-key');

      expect(result).toBe(true);
      expect(mockRedisClient.set).toHaveBeenCalledWith('current_account_key', 'test-key');
      expect(mockRedisClient.del).toHaveBeenCalledWith('authorized_phone_numbers');
    });

    it('should return false on Redis error', async () => {
      mockRedisClient.set.mockRejectedValue(new Error('Redis error'));

      const result = await accountService.setCurrentAccountKey('test-key');

      expect(result).toBe(false);
    });
  });
});