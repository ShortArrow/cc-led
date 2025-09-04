/**
 * @fileoverview CLI Rainbow Command Tests
 * 
 * Tests rainbow animation commands with various interval settings
 * and validates the generated serial commands.
 * 
 * Following Zenn article best practices for self-contained tests without timeouts.
 */

import { it, expect, vi, beforeEach } from 'vitest';

// Mock SerialPort with immediate synchronous behavior
const mockWrite = vi.fn((data, callback) => {
  if (callback) callback(); // Immediate success callback
});

const mockSerialPortInstance = {
  write: mockWrite,
  close: vi.fn((callback) => { if (callback) callback(); }),
  on: vi.fn((event, handler) => {
    // For data events, immediately call with a mock success response
    if (event === 'data') {
      setImmediate(() => handler(Buffer.from('ACCEPTED,TEST')));
    }
  }),
  off: vi.fn(),
  removeListener: vi.fn(),
  isOpen: true
};

const MockSerialPort = vi.fn((config, callback) => {
  // Immediate successful connection callback
  if (callback) setImmediate(() => callback(null));
  return mockSerialPortInstance;
});

vi.mock('serialport', () => ({
  SerialPort: MockSerialPort
}));

vi.mock('../src/utils/config.js', () => ({
  getSerialPort: vi.fn(() => 'COM3')
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// Rainbow Command Tests

it('--rainbow should generate RAINBOW,500 (default 500ms)', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  await executeCommand({ port: 'COM3', rainbow: true });
  
  expect(mockWrite).toHaveBeenCalledWith('RAINBOW,500\n', expect.any(Function));
});

it('--rainbow --interval 100 should generate RAINBOW,100', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  await executeCommand({ port: 'COM3', rainbow: true, interval: 100 });
  
  expect(mockWrite).toHaveBeenCalledWith('RAINBOW,100\n', expect.any(Function));
});

it('--rainbow --interval 2000 should generate RAINBOW,2000', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  await executeCommand({ port: 'COM3', rainbow: true, interval: 2000 });
  
  expect(mockWrite).toHaveBeenCalledWith('RAINBOW,2000\n', expect.any(Function));
});