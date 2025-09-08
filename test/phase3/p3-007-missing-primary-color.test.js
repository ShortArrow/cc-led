/**
 * @fileoverview P3-007: Missing Primary Color for Two-Color Blink Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: --blink --second-color blue (no primary) => Error
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

test('P3-007: --blink --second-color blue without primary color should use default white', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Execute: Two-color blink with only second color (should use white as default)
  await executeCommand({ port: 'COM3', blink: true, secondColor: 'blue' });
  
  // Assert: Two-color blink with white and blue
  expect(mockWrite).toHaveBeenCalledWith('BLINK2,255,255,255,0,0,255,500\n', expect.any(Function));
});