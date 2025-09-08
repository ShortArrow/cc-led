/**
 * @fileoverview P3-014: No Port Error Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: No port in any source => descriptive error
 */

import { test, expect, vi } from 'vitest';
import { executeCommand } from '../../src/controller.js';

// Mock SerialPort (shouldn't be called)
const mockWrite = vi.fn((data, callback) => {
  if (callback) callback();
});

const mockSerialPortInstance = {
  write: mockWrite,
  close: vi.fn((callback) => { if (callback) callback(); }),
  on: vi.fn((event, handler) => {
    if (event === 'data') {
      setImmediate(() => handler(Buffer.from('ACCEPTED,TEST')));
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
  getSerialPort: vi.fn(() => {
    throw new Error('Serial port not specified. Use -p option or set SERIAL_PORT in .env file');
  })
}));

test('P3-014: No port in any source throws descriptive error', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Setup: Clear environment
  const originalPort = process.env.SERIAL_PORT;
  delete process.env.SERIAL_PORT;
  
  // Execute & Assert: Should throw descriptive error
  await expect(executeCommand({ on: true }))
    .rejects.toThrow('Serial port not specified. Use -p option or set SERIAL_PORT in .env file');
  
  // Restore
  if (originalPort) process.env.SERIAL_PORT = originalPort;
});