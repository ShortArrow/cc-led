/**
 * @fileoverview Response Timeout Tests
 * 
 * Tests timeout behavior when no response is received from microcontrollers.
 * Verifies proper timeout handling in different environments.
 * 
 * Following Zenn article best practices for self-contained tests without timeouts.
 */

import { it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock console methods to capture output
const originalConsoleLog = console.log;
const capturedLogs = [];

// Mock SerialPort with configurable responses (including no response)
let mockResponseData = 'ACCEPTED,TEST';
let shouldRespond = true;

const mockWrite = vi.fn((data, callback) => {
  if (callback) callback(); // Immediate success callback
});

const mockSerialPortInstance = {
  write: mockWrite,
  close: vi.fn((callback) => { if (callback) callback(); }),
  on: vi.fn((event, handler) => {
    // For data events, call with configurable response only if shouldRespond is true
    if (event === 'data' && shouldRespond) {
      setImmediate(() => handler(Buffer.from(mockResponseData)));
    }
    // If shouldRespond is false, don't call handler to simulate timeout
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
  shouldRespond = true;
  console.log = (...args) => {
    capturedLogs.push(args.join(' '));
    originalConsoleLog(...args);
  };
});

afterEach(() => {
  console.log = originalConsoleLog;
});

// Helper functions
function setMockResponse(response) {
  mockResponseData = response;
}

function simulateTimeout() {
  shouldRespond = false;
}

// Response Timeout Tests

it('should handle timeout in test environment (10ms)', async () => {
  const { LedController } = await import('../src/controller.js');
  
  simulateTimeout(); // No response will be sent
  
  const controller = new LedController('COM3');
  await controller.connect();
  
  await controller.setColor('red');
  
  // Verify command was sent
  expect(mockWrite).toHaveBeenCalledWith('COLOR,255,0,0\n', expect.any(Function));
  
  // Should log timeout message (in test env, timeout is 10ms)
  const hasTimeout = capturedLogs.some(log => 
    log.includes('No response received from device')
  );
  expect(hasTimeout).toBe(true);
});

it('should handle response after timeout period', async () => {
  const { LedController } = await import('../src/controller.js');
  
  // Start with timeout, then enable response
  simulateTimeout();
  
  const controller = new LedController('COM3');
  await controller.connect();
  
  // Send command (will timeout)
  await controller.setColor('red');
  
  // Verify timeout occurred
  const hasTimeout = capturedLogs.some(log => 
    log.includes('No response received from device')
  );
  expect(hasTimeout).toBe(true);
  
  // Verify command was still sent
  expect(mockWrite).toHaveBeenCalledWith('COLOR,255,0,0\n', expect.any(Function));
});

it('should handle normal response without timeout', async () => {
  const { LedController } = await import('../src/controller.js');
  
  setMockResponse('ACCEPTED,COLOR,255,0,0');
  // shouldRespond remains true (default)
  
  const controller = new LedController('COM3');
  await controller.connect();
  
  await controller.setColor('red');
  
  // Verify command was sent
  expect(mockWrite).toHaveBeenCalledWith('COLOR,255,0,0\n', expect.any(Function));
  
  // Should receive response, no timeout
  const hasResponse = capturedLogs.some(log => 
    log.includes('Device response: ACCEPTED,COLOR,255,0,0')
  );
  expect(hasResponse).toBe(true);
  
  const hasTimeout = capturedLogs.some(log => 
    log.includes('No response received from device')
  );
  expect(hasTimeout).toBe(false);
});

it('should continue operation after timeout', async () => {
  const { LedController } = await import('../src/controller.js');
  
  const controller = new LedController('COM3');
  await controller.connect();
  
  // First command will timeout
  simulateTimeout();
  await controller.setColor('red');
  
  // Second command will succeed
  shouldRespond = true;
  setMockResponse('ACCEPTED,OFF');
  await controller.turnOff();
  
  // Verify both commands were sent
  expect(mockWrite).toHaveBeenCalledWith('COLOR,255,0,0\n', expect.any(Function));
  expect(mockWrite).toHaveBeenCalledWith('OFF\n', expect.any(Function));
  expect(mockWrite).toHaveBeenCalledTimes(2);
  
  // Should have both timeout and success messages
  const hasTimeout = capturedLogs.some(log => 
    log.includes('No response received from device')
  );
  const hasResponse = capturedLogs.some(log => 
    log.includes('Device response: ACCEPTED,OFF')
  );
  
  expect(hasTimeout).toBe(true);
  expect(hasResponse).toBe(true);
});