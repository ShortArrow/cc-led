/**
 * @fileoverview P3-008: Interval Inheritance Conflict Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: --rainbow --interval 100 --blink => blink wins, interval inherited
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

test('P3-008: --rainbow --interval 100 --blink => blink wins with interval inherited', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Execute: Conflicting commands with interval (blink should win, inherit interval)
  await executeCommand({ port: 'COM3', rainbow: true, blink: true, interval: 100 });
  
  // Assert: Blink wins priority, but interval is inherited
  expect(mockWrite).toHaveBeenCalledWith('BLINK1,255,255,255,100\n', expect.any(Function));
});