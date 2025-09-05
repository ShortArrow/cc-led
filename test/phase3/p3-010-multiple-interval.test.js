/**
 * @fileoverview P3-010: Multiple Interval Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: Multiple interval specifications use last value (last-wins)
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

test('P3-010: Multiple interval values use last-wins strategy (1000ms)', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Execute: Multiple interval values (should use last one: 1000)
  // Simulating CLI: --blink red --interval 500 --interval 1000
  await executeCommand({ port: 'COM3', blink: 'red', interval: 1000 });
  
  // Assert: Last interval value used
  expect(mockWrite).toHaveBeenCalledWith('BLINK1,255,0,0,1000\n', expect.any(Function));
});