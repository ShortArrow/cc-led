/**
 * @fileoverview P3-006: CLI Blink Color Conflict Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: --blink red --color blue => blink red wins (conflict resolution)
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

test('P3-006: --blink red --color blue => BLINK1,255,0,0,500\\n (blink red wins)', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Execute: Conflicting color specifications (blink should win with red)
  await executeCommand({ port: 'COM3', blink: 'red', color: 'blue' });
  
  // Assert: Blink takes priority, red color used (not blue)
  expect(mockWrite).toHaveBeenCalledWith('BLINK1,255,0,0,500\n', expect.any(Function));
});