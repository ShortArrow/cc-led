/**
 * @fileoverview P2-012 to P2-014: Interval Boundary Tests
 * 
 * Tests interval validation for blink and rainbow commands
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

it('P2-012: should accept minimum interval value (1ms)', async () => {
  await executeCommand({ port: 'COM3', blink: 'red', interval: 1 });
  expect(mockWrite).toHaveBeenCalledWith('BLINK1,255,0,0,1\n', expect.any(Function));
});

it('P2-013: should reject zero interval value', async () => {
  await expect(executeCommand({ port: 'COM3', blink: 'red', interval: 0 }))
    .rejects.toThrow('Invalid interval');
});

it('P2-014: should reject negative interval value', async () => {
  await expect(executeCommand({ port: 'COM3', blink: 'red', interval: -1 }))
    .rejects.toThrow('Invalid interval');
});