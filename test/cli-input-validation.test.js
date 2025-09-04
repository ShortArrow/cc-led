/**
 * @fileoverview CLI Input Validation Tests
 * 
 * Tests input validation for CLI parameters including invalid colors,
 * malformed RGB values, and unsupported color names.
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

// Input Validation Tests

it('should reject invalid color name', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  await expect(executeCommand({ port: 'COM3', color: 'invalid_color' }))
    .rejects.toThrow('Invalid color');
});

it('should reject malformed RGB values', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  await expect(executeCommand({ port: 'COM3', color: 'not,rgb,format' }))
    .rejects.toThrow('Invalid color');
});

it('should handle valid named colors', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  // Test a few valid color names
  const validColors = [
    { name: 'red', rgb: '255,0,0' },
    { name: 'green', rgb: '0,255,0' },
    { name: 'blue', rgb: '0,0,255' }
  ];
  
  for (const { name, rgb } of validColors) {
    await executeCommand({ port: 'COM3', color: name });
    expect(mockWrite).toHaveBeenCalledWith(`COLOR,${rgb}\n`, expect.any(Function));
    vi.clearAllMocks();
  }
});

it('should handle valid RGB format', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  await executeCommand({ port: 'COM3', color: '128,64,192' });
  
  expect(mockWrite).toHaveBeenCalledWith('COLOR,128,64,192\n', expect.any(Function));
});