/**
 * @fileoverview REJECT Response Tests
 * 
 * Tests parsing and display of REJECT responses from microcontrollers.
 * Covers error scenarios and their appropriate handling and display.
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

// REJECT Response Tests

it('should handle REJECT with invalid command', async () => {
  const { LedController } = await import('../src/controller.js');
  
  setMockResponse('REJECT,INVALID_COMMAND');
  
  const controller = new LedController('COM3');
  await controller.connect();
  
  await controller.setColor('red');
  
  // Verify command was sent
  expect(mockWrite).toHaveBeenCalledWith('COLOR,255,0,0\n', expect.any(Function));
  
  // Verify REJECT response was logged
  const hasReject = capturedLogs.some(log => 
    log.includes('Device response: REJECT,INVALID_COMMAND')
  );
  expect(hasReject).toBe(true);
});

it('should handle REJECT with invalid parameter', async () => {
  const { LedController } = await import('../src/controller.js');
  
  setMockResponse('REJECT,INVALID_PARAMETER');
  
  const controller = new LedController('COM3');
  await controller.connect();
  
  await controller.setColor('red');
  
  // Verify command was sent
  expect(mockWrite).toHaveBeenCalledWith('COLOR,255,0,0\n', expect.any(Function));
  
  // Verify REJECT response was logged
  const hasReject = capturedLogs.some(log => 
    log.includes('Device response: REJECT,INVALID_PARAMETER')
  );
  expect(hasReject).toBe(true);
});

it('should handle REJECT with hardware error', async () => {
  const { LedController } = await import('../src/controller.js');
  
  setMockResponse('REJECT,HARDWARE_ERROR');
  
  const controller = new LedController('COM3');
  await controller.connect();
  
  await controller.turnOn();
  
  // Verify command was sent
  expect(mockWrite).toHaveBeenCalledWith('ON\n', expect.any(Function));
  
  // Verify REJECT response was logged
  const hasReject = capturedLogs.some(log => 
    log.includes('Device response: REJECT,HARDWARE_ERROR')
  );
  expect(hasReject).toBe(true);
});

it('should handle REJECT with custom error message', async () => {
  const { LedController } = await import('../src/controller.js');
  
  setMockResponse('REJECT,CUSTOM_ERROR_MESSAGE');
  
  const controller = new LedController('COM3');
  await controller.connect();
  
  await controller.blink('blue', 500);
  
  // Verify command was sent
  expect(mockWrite).toHaveBeenCalledWith('BLINK1,0,0,255,500\n', expect.any(Function));
  
  // Verify REJECT response was logged
  const hasReject = capturedLogs.some(log => 
    log.includes('Device response: REJECT,CUSTOM_ERROR_MESSAGE')
  );
  expect(hasReject).toBe(true);
});

it('should handle malformed REJECT response', async () => {
  const { LedController } = await import('../src/controller.js');
  
  setMockResponse('REJECT');  // Missing error code
  
  const controller = new LedController('COM3');
  await controller.connect();
  
  await controller.setColor('green');
  
  // Verify command was sent
  expect(mockWrite).toHaveBeenCalledWith('COLOR,0,255,0\n', expect.any(Function));
  
  // Should handle gracefully - may log partial response
  const hasReject = capturedLogs.some(log => 
    log.includes('Device response: REJECT')
  );
  expect(hasReject).toBe(true);
});