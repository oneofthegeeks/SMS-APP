// Example unit tests for validation middleware
const { validateSMSInput, validateAccountInput } = require('../../middleware/validation');
const { AppError } = require('../../middleware/errorHandler');

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {};
    next = jest.fn();
  });

  describe('validateSMSInput', () => {
    it('should pass validation with valid SMS input', () => {
      req.body = {
        ownerPhoneNumber: '+15551234567',
        contactCountryCode: '1',
        contactPhoneNumber: '5559876543',
        messageBody: 'Test message'
      };

      expect(() => validateSMSInput(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });

    it('should throw error for missing message body', () => {
      req.body = {
        ownerPhoneNumber: '+15551234567',
        contactCountryCode: '1',
        contactPhoneNumber: '5559876543'
        // messageBody missing
      };

      expect(() => validateSMSInput(req, res, next)).toThrow(AppError);
    });

    it('should throw error for empty message body', () => {
      req.body = {
        ownerPhoneNumber: '+15551234567',
        contactCountryCode: '1',
        contactPhoneNumber: '5559876543',
        messageBody: '   ' // Empty/whitespace only
      };

      expect(() => validateSMSInput(req, res, next)).toThrow(AppError);
    });

    it('should throw error for message body too long', () => {
      req.body = {
        ownerPhoneNumber: '+15551234567',
        contactCountryCode: '1',
        contactPhoneNumber: '5559876543',
        messageBody: 'x'.repeat(1601) // Exceeds 1600 character limit
      };

      expect(() => validateSMSInput(req, res, next)).toThrow(AppError);
    });

    it('should throw error for invalid phone number format', () => {
      req.body = {
        ownerPhoneNumber: '+15551234567',
        contactCountryCode: '1',
        contactPhoneNumber: '123', // Invalid format
        messageBody: 'Test message'
      };

      expect(() => validateSMSInput(req, res, next)).toThrow(AppError);
    });

    it('should throw error for invalid country code', () => {
      req.body = {
        ownerPhoneNumber: '+15551234567',
        contactCountryCode: 'invalid', // Invalid country code
        contactPhoneNumber: '5559876543',
        messageBody: 'Test message'
      };

      expect(() => validateSMSInput(req, res, next)).toThrow(AppError);
    });

    it('should validate manual owner phone number entry', () => {
      req.body = {
        ownerCountryCode: '1',
        ownerPhoneNumber: '5551234567',
        contactCountryCode: '1',
        contactPhoneNumber: '5559876543',
        messageBody: 'Test message'
      };

      expect(() => validateSMSInput(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateAccountInput', () => {
    it('should pass validation with valid account input', () => {
      req.body = {
        accountKey: 'valid-account-key',
        accountName: 'Test Account'
      };

      expect(() => validateAccountInput(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });

    it('should throw error for missing account key', () => {
      req.body = {
        accountName: 'Test Account'
        // accountKey missing
      };

      expect(() => validateAccountInput(req, res, next)).toThrow(AppError);
    });

    it('should throw error for empty account key', () => {
      req.body = {
        accountKey: '   ', // Empty/whitespace only
        accountName: 'Test Account'
      };

      expect(() => validateAccountInput(req, res, next)).toThrow(AppError);
    });

    it('should throw error for account name too long', () => {
      req.body = {
        accountKey: 'valid-key',
        accountName: 'x'.repeat(101) // Exceeds 100 character limit
      };

      expect(() => validateAccountInput(req, res, next)).toThrow(AppError);
    });

    it('should pass validation without account name (optional)', () => {
      req.body = {
        accountKey: 'valid-account-key'
        // accountName optional
      };

      expect(() => validateAccountInput(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });

    it('should throw error for non-string account name', () => {
      req.body = {
        accountKey: 'valid-key',
        accountName: 123 // Non-string value
      };

      expect(() => validateAccountInput(req, res, next)).toThrow(AppError);
    });
  });
});