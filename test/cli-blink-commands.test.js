/**
 * @fileoverview CLI Blink Command Tests
 * 
 * Tests blink commands including single-color and two-color blinking,
 * with various interval settings and color combinations.
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

// Single Color Blink Tests

it('--blink should generate BLINK1,255,255,255,500 (default white, 500ms)', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  await executeCommand({ port: 'COM3', blink: true, interval: 500 });
  
  expect(mockWrite).toHaveBeenCalledWith('BLINK1,255,255,255,500\n', expect.any(Function));
});

it('--blink red --interval 1000 should generate BLINK1,255,0,0,1000', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  await executeCommand({ port: 'COM3', blink: 'red', interval: 1000 });
  
  expect(mockWrite).toHaveBeenCalledWith('BLINK1,255,0,0,1000\n', expect.any(Function));
});

it('--blink --color blue --interval 200 should prioritize blink color over color flag', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  await executeCommand({ 
    port: 'COM3', 
    blink: true, 
    color: 'blue',  // This becomes the blink color
    interval: 200 
  });
  
  expect(mockWrite).toHaveBeenCalledWith('BLINK1,0,0,255,200\n', expect.any(Function));
});

// Two Color Blink Tests

it('--blink red --second-color blue --interval 750 should generate BLINK2 command', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  await executeCommand({ 
    port: 'COM3', 
    blink: 'red',
    secondColor: 'blue',
    interval: 750
  });
  
  expect(mockWrite).toHaveBeenCalledWith('BLINK2,255,0,0,0,0,255,750\n', expect.any(Function));
});