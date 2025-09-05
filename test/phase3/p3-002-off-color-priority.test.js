/**
 * @fileoverview P3-002: Off/Color Priority Test
 * 
 * Tests that --off takes priority over --color when both are specified
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

it('P3-002: should turn off LED when --off and --color are specified', async () => {
  await executeCommand({ port: 'COM3', off: true, color: 'red' });
  
  expect(mockWrite).toHaveBeenCalledWith('OFF\n', expect.any(Function));
});