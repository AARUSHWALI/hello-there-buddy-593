// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://localhost:27017/people-ai-test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRE = '1h';
process.env.JWT_COOKIE_EXPIRE = '1';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX = '100';
process.env.CLIENT_URL = 'http://localhost:3000';

// Mock console methods to keep test output clean
// eslint-disable-next-line no-console
console.log = jest.fn();
// eslint-disable-next-line no-console
console.error = jest.fn();
// eslint-disable-next-line no-console
console.warn = jest.fn();
