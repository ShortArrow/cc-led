/**
 * @fileoverview P3-004: Color vs Rainbow Priority Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: --color red --rainbow => RAINBOW wins
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

test('P3-004: --color red --rainbow => RAINBOW,50\\n (rainbow wins)', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Execute: Conflicting commands (rainbow should win)
  await executeCommand({ port: 'COM3', color: 'red', rainbow: true });
  
  // Assert: RAINBOW command sent (not COLOR)
  expect(mockWrite).toHaveBeenCalledWith('RAINBOW,50\n', expect.any(Function));
});