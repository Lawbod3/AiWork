// Global test setup
// This file runs before all tests

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'sqlite:./test.db';
process.env.PORT = '3000';

// Suppress console output during tests (optional)
// jest.spyOn(console, 'log').mockImplementation(() => {});
// jest.spyOn(console, 'error').mockImplementation(() => {});
