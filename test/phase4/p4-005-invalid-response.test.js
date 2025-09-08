/**
 * @fileoverview P4-005: Invalid Response Handling Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: Invalid response treated as timeout
 */

import { test, expect, vi } from 'vitest';
import { LedController } from '../../src/controller.js';

// Mock console to capture timeout behavior
const mockConsoleLog = vi.fn();
vi.spyOn(console, 'log').mockImplementation(mockConsoleLog);

// Mock SerialPort with invalid response
const mockWrite = vi.fn((data, callback) => {
  if (callback) callback();
});

const mockSerialPortInstance = {
  write: mockWrite,
  close: vi.fn((callback) => { if (callback) callback(); }),
  on: vi.fn((event, handler) => {
    if (event === 'data') {
      // Send invalid response format
      setImmediate(() => handler(Buffer.from('STATUS,OK,ready')));
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

test('P4-005: Invalid response STATUS,OK,ready treated as timeout', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Setup: Set test environment for fast timeout
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';
  
  // Execute: Send command that will receive invalid response
  const controller = new LedController('COM3');
  await controller.connect();
  await controller.sendCommand('ON');
  await controller.disconnect();
  
  // Assert: Invalid response was ignored, timeout occurred
  expect(mockConsoleLog).toHaveBeenCalledWith('No response received from device (timeout)');
  
  // Restore
  process.env.NODE_ENV = originalEnv;
  mockConsoleLog.mockRestore();
});