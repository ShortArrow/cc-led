/**
 * @fileoverview P4-004: Timeout Handling Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: No response triggers timeout message
 */

import { test, expect, vi } from 'vitest';
import { LedController } from '../../src/controller.js';

// Mock console to capture timeout message
const mockConsoleLog = vi.fn();
vi.spyOn(console, 'log').mockImplementation(mockConsoleLog);

// Mock SerialPort with no response (timeout scenario)
const mockWrite = vi.fn((data, callback) => {
  if (callback) callback();
});

const mockSerialPortInstance = {
  write: mockWrite,
  close: vi.fn((callback) => { if (callback) callback(); }),
  on: vi.fn(), // No 'data' event handler = no response
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

test('P4-004: No response from device triggers timeout message display', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Setup: Set test environment for fast timeout
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';
  
  // Execute: Send command that will timeout (no response handler)
  const controller = new LedController('COM3');
  await controller.connect();
  await controller.sendCommand('ON');
  await controller.disconnect();
  
  // Assert: Timeout message was logged
  expect(mockConsoleLog).toHaveBeenCalledWith('No response received from device (timeout)');
  
  // Restore
  process.env.NODE_ENV = originalEnv;
  mockConsoleLog.mockRestore();
});