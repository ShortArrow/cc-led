/**
 * @fileoverview P2-001, P2-002: RGB Success Boundary Tests - Test-Matrix.md Compliant
 * 
 * Self-contained tests following Test-Matrix.md guidelines.
 * Tests successful RGB color boundary validation
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

test('P2-001: should accept RGB minimum values (0,0,0)', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Execute: Send COLOR command with minimum RGB values
  await executeCommand({ port: 'COM3', color: '0,0,0' });
  
  // Assert: COLOR command transmitted correctly
  expect(mockWrite).toHaveBeenCalledWith('COLOR,0,0,0\n', expect.any(Function));
});

test('P2-002: should accept RGB maximum values (255,255,255)', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Execute: Send COLOR command with maximum RGB values
  await executeCommand({ port: 'COM3', color: '255,255,255' });
  
  // Assert: COLOR command transmitted correctly
  expect(mockWrite).toHaveBeenCalledWith('COLOR,255,255,255\n', expect.any(Function));
});