/**
 * @fileoverview Response Integration Tests
 * 
 * Tests integration between command execution and response handling
 * including end-to-end command-response cycles.
 * 
 * Following Zenn article best practices for self-contained tests without timeouts.
 */

import { it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock console methods to capture output
const originalConsoleLog = console.log;
const capturedLogs = [];

// Mock SerialPort with configurable responses
let mockResponseData = 'ACCEPTED,TEST';
const mockWrite = vi.fn((data, callback) => {
  if (callback) callback(); // Immediate success callback
});

const mockSerialPortInstance = {
  write: mockWrite,
  close: vi.fn((callback) => { if (callback) callback(); }),
  on: vi.fn((event, handler) => {
    // For data events, call with configurable response
    if (event === 'data') {
      setImmediate(() => handler(Buffer.from(mockResponseData)));
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
  capturedLogs.length = 0;
  mockResponseData = 'ACCEPTED,TEST';
  console.log = (...args) => {
    capturedLogs.push(args.join(' '));
    originalConsoleLog(...args);
  };
});

afterEach(() => {
  console.log = originalConsoleLog;
});

// Helper function to set mock response
function setMockResponse(response) {
  mockResponseData = response;
}

// Response Integration Tests

it('should handle complete command-response cycle for COLOR', async () => {
  const { LedController } = await import('../src/controller.js');
  
  setMockResponse('ACCEPTED,COLOR,255,0,0');
  
  const controller = new LedController('COM3');
  await controller.connect();
  
  await controller.setColor('red');
  
  // Verify command was sent
  expect(mockWrite).toHaveBeenCalledWith('COLOR,255,0,0\n', expect.any(Function));
  
  // Verify response was processed
  const hasCommand = capturedLogs.some(log => log.includes('Sent command: COLOR,255,0,0'));
  const hasResponse = capturedLogs.some(log => log.includes('Device response: ACCEPTED,COLOR,255,0,0'));
  
  expect(hasCommand).toBe(true);
  expect(hasResponse).toBe(true);
});

it('should handle complete command-response cycle for BLINK', async () => {
  const { LedController } = await import('../src/controller.js');
  
  setMockResponse('ACCEPTED,BLINK1,0,255,0,1000');
  
  const controller = new LedController('COM3');
  await controller.connect();
  
  await controller.blink('green', 1000);
  
  // Verify command was sent
  expect(mockWrite).toHaveBeenCalledWith('BLINK1,0,255,0,1000\n', expect.any(Function));
  
  // Verify response was processed
  const hasCommand = capturedLogs.some(log => log.includes('Sent command: BLINK1,0,255,0,1000'));
  const hasResponse = capturedLogs.some(log => log.includes('Device response: ACCEPTED,BLINK1,0,255,0,1000'));
  
  expect(hasCommand).toBe(true);
  expect(hasResponse).toBe(true);
});

it('should handle REJECT response in integration', async () => {
  const { LedController } = await import('../src/controller.js');
  
  setMockResponse('REJECT,INVALID_COLOR');
  
  const controller = new LedController('COM3');
  await controller.connect();
  
  await controller.setColor('red');
  
  // Verify command was sent
  expect(mockWrite).toHaveBeenCalledWith('COLOR,255,0,0\n', expect.any(Function));
  
  // Verify rejection was logged
  const hasCommand = capturedLogs.some(log => log.includes('Sent command: COLOR,255,0,0'));
  const hasReject = capturedLogs.some(log => log.includes('Device response: REJECT,INVALID_COLOR'));
  
  expect(hasCommand).toBe(true);
  expect(hasReject).toBe(true);
});

it('should handle multiple sequential commands', async () => {
  const { LedController } = await import('../src/controller.js');
  
  const controller = new LedController('COM3');
  await controller.connect();
  
  // Send multiple commands
  setMockResponse('ACCEPTED,ON');
  await controller.turnOn();
  
  setMockResponse('ACCEPTED,COLOR,0,0,255');
  await controller.setColor('blue');
  
  setMockResponse('ACCEPTED,OFF');
  await controller.turnOff();
  
  // Verify all commands were sent
  expect(mockWrite).toHaveBeenCalledWith('ON\n', expect.any(Function));
  expect(mockWrite).toHaveBeenCalledWith('COLOR,0,0,255\n', expect.any(Function));
  expect(mockWrite).toHaveBeenCalledWith('OFF\n', expect.any(Function));
  
  expect(mockWrite).toHaveBeenCalledTimes(3);
});