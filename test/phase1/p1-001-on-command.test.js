/**
 * @fileoverview P1-001: ON Command Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: CLI --on command sends ON\n to serial port
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
  getSerialPort: vi.fn(() => 'COM3')
}));

test('P1-001: CLI --on command sends ON\\n to serial port', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Execute: Send ON command
  await executeCommand({ port: 'COM3', on: true });
  
  // Assert: ON command transmitted correctly
  expect(mockWrite).toHaveBeenCalledWith('ON\n', expect.any(Function));
});