/**
 * @fileoverview P1-002: OFF Command Test
 * 
 * Verifies that --off flag generates correct OFF serial command
 */

import { it, expect, beforeEach, vi } from 'vitest';
import { executeCommand } from '../../src/controller.js';

// Mock SerialPort directly
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

beforeEach(() => {
  vi.clearAllMocks();
});

it('P1-002: --off flag should generate OFF command', async () => {
  await executeCommand({ port: 'COM3', off: true });
  
  expect(mockWrite).toHaveBeenCalledWith('OFF\n', expect.any(Function));
});