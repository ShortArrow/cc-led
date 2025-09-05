/**
 * @fileoverview P1-003: Color Command Test
 * 
 * Verifies that --color red generates correct COLOR,255,0,0 serial command
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

it('P1-003: --color red should generate COLOR,255,0,0 command', async () => {
  await executeCommand({ port: 'COM3', color: 'red' });
  
  expect(mockWrite).toHaveBeenCalledWith('COLOR,255,0,0\n', expect.any(Function));
});