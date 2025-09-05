/**
 * @fileoverview P3-005: ON vs OFF Same Level Priority Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: --on --off => ON wins (same-level priority handling)
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

test('P3-005: --on --off => ON\\n (ON wins same-level priority)', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Execute: Same-level conflicting commands (ON should win)
  await executeCommand({ port: 'COM3', on: true, off: true });
  
  // Assert: ON command sent (not OFF)
  expect(mockWrite).toHaveBeenCalledWith('ON\n', expect.any(Function));
});