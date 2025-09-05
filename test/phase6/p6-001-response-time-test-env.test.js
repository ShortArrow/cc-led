/**
 * @fileoverview P6-001: Response Time Test Environment - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: Response processing completes under 20ms in test environment
 */

import { test, expect, vi } from 'vitest';
import { executeCommand } from '../../src/controller.js';

// Mock SerialPort with hoisting-safe approach
const mockWrite = vi.fn((data, callback) => {
  if (callback) callback();
});

const mockSerialPortInstance = {
  write: mockWrite,
  close: vi.fn((callback) => { if (callback) callback(); }),
  on: vi.fn((event, handler) => {
    if (event === 'data') {
      setImmediate(() => handler(Buffer.from('ACCEPTED,ON')));
    }
  }),
  off: vi.fn(),
  isOpen: true
};

vi.mock('serialport', () => ({
  SerialPort: vi.fn((config, callback) => {
    if (callback) setImmediate(() => callback(null));
    return mockSerialPortInstance;
  })
}));

vi.mock('../../src/utils/config.js', () => ({
  getSerialPort: vi.fn(() => 'COM3')
}));

test('P6-001: Response processing completes under 20ms in test environment', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Setup: Ensure test environment
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';
  
  // Execute: Measure response time
  const startTime = Date.now();
  await executeCommand({ port: 'COM3', on: true });
  const endTime = Date.now();
  
  // Assert: Response time under threshold
  expect(endTime - startTime).toBeLessThan(20);
  
  // Restore
  process.env.NODE_ENV = originalEnv;
});