/**
 * @fileoverview P5-001: Digital LED Color Warning Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: Digital board shows warning for non-white colors
 */

import { test, expect, vi } from 'vitest';
import { LedController } from '../../src/controller.js';

// Mock console to capture warning message
const mockConsoleLog = vi.fn();
vi.spyOn(console, 'log').mockImplementation(mockConsoleLog);

// Mock SerialPort
const mockWrite = vi.fn((data, callback) => {
  if (callback) callback();
});

const mockSerialPortInstance = {
  write: mockWrite,
  close: vi.fn((callback) => { if (callback) callback(); }),
  on: vi.fn((event, handler) => {
    if (event === 'data') {
      setImmediate(() => handler(Buffer.from('ACCEPTED,COLOR')));
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

test('P5-001: Digital LED board shows color warning for red and sends command', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Setup: Digital LED board mock
  const mockBoard = { getLedProtocol: () => 'Digital' };
  
  // Execute: Set non-white color on digital LED
  const controller = new LedController('COM3', { board: mockBoard });
  await controller.connect();
  await controller.setColor('red');
  await controller.disconnect();
  
  // Assert: Warning displayed and command still sent
  expect(mockConsoleLog).toHaveBeenCalledWith(
    "Note: Digital LED does not support colors. Color 'red' ignored, turning LED on."
  );
  expect(mockWrite).toHaveBeenCalledWith('COLOR,255,0,0\n', expect.any(Function));
  
  // Restore
  mockConsoleLog.mockRestore();
});