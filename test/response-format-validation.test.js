/**
 * @fileoverview Response Format Validation Tests
 * 
 * Tests parsing and validation of device response formats including
 * ACCEPTED/REJECT responses and malformed response handling.
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

// Response Format Validation Tests

it('should parse ACCEPTED response correctly', async () => {
  const { LedController } = await import('../src/controller.js');
  
  setMockResponse('ACCEPTED,COLOR,255,0,0');
  
  const controller = new LedController('COM3');
  await controller.connect();
  
  await controller.setColor('red');
  
  // Check that command was sent and response was logged
  expect(mockWrite).toHaveBeenCalledWith('COLOR,255,0,0\n', expect.any(Function));
  
  const hasResponse = capturedLogs.some(log => 
    log.includes('Device response: ACCEPTED,COLOR,255,0,0')
  );
  expect(hasResponse).toBe(true);
});

it('should parse REJECT response correctly', async () => {
  const { LedController } = await import('../src/controller.js');
  
  setMockResponse('REJECT,INVALID_COMMAND');
  
  const controller = new LedController('COM3');
  await controller.connect();
  
  await controller.setColor('red');
  
  // Check that command was sent and response was logged
  expect(mockWrite).toHaveBeenCalledWith('COLOR,255,0,0\n', expect.any(Function));
  
  const hasResponse = capturedLogs.some(log => 
    log.includes('Device response: REJECT,INVALID_COMMAND')
  );
  expect(hasResponse).toBe(true);
});

it('should handle malformed response gracefully', async () => {
  const { LedController } = await import('../src/controller.js');
  
  setMockResponse('MALFORMED_RESPONSE');
  
  const controller = new LedController('COM3');
  await controller.connect();
  
  await controller.setColor('red');
  
  // Command should still be sent
  expect(mockWrite).toHaveBeenCalledWith('COLOR,255,0,0\n', expect.any(Function));
  
  // Should handle gracefully - either timeout or no response logged
  // Implementation dependent behavior
});

it('should handle empty response', async () => {
  const { LedController } = await import('../src/controller.js');
  
  setMockResponse('');
  
  const controller = new LedController('COM3');
  await controller.connect();
  
  await controller.setColor('red');
  
  // Command should still be sent
  expect(mockWrite).toHaveBeenCalledWith('COLOR,255,0,0\n', expect.any(Function));
  
  // Should handle gracefully
});