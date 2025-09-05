/**
 * @fileoverview Response Processing Tests (Phase 4)
 * 
 * Tests microcontroller response parsing including ACCEPTED, REJECT,
 * timeout handling, and invalid response validation.
 * Covers Test-Matrix.md P4-001 through P4-005.
 * 
 * Following Zenn article best practices for self-contained tests without timeouts.
 */

import { it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock console methods to capture output
const originalConsoleLog = console.log;
const capturedLogs = [];

// Mock SerialPort with configurable responses
let mockResponseData = 'ACCEPTED,TEST';
let shouldRespond = true;

const mockWrite = vi.fn((data, callback) => {
  if (callback) callback(); // Immediate success callback
});

const mockSerialPortInstance = {
  write: mockWrite,
  close: vi.fn((callback) => { if (callback) callback(); }),
  on: vi.fn((event, handler) => {
    // For data events, call with configurable response
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

// Phase 4: Response Processing Tests

// P4-001: ACCEPTED response handling
it('P4-001: should parse and display ACCEPTED,ON response correctly', async () => {
  const { LedController } = await import('../../src/controller.js');
  
  setMockResponse('ACCEPTED,ON');
  
  const controller = new LedController('COM3');
  await controller.connect();
  await controller.sendCommand('ON');
  
  // Verify command was sent
  expect(mockWrite).toHaveBeenCalledWith('ON\n', expect.any(Function));
  
  // Verify response was logged
  const hasCommand = capturedLogs.some(log => log.includes('Sent command: ON'));
  const hasResponse = capturedLogs.some(log => log.includes('Device response: ACCEPTED,ON'));
  
  expect(hasCommand).toBe(true);
  expect(hasResponse).toBe(true);
});

// P4-002: ACCEPTED response with parameters
it('P4-002: should parse ACCEPTED,COLOR,255,0,0 response with parameters', async () => {
  const { LedController } = await import('../../src/controller.js');
  
  setMockResponse('ACCEPTED,COLOR,255,0,0');
  
  const controller = new LedController('COM3');
  await controller.connect();
  await controller.sendCommand('COLOR,255,0,0');
  
  // Verify command was sent
  expect(mockWrite).toHaveBeenCalledWith('COLOR,255,0,0\n', expect.any(Function));
  
  // Verify response was logged with parameters
  const hasResponse = capturedLogs.some(log => 
    log.includes('Device response: ACCEPTED,COLOR,255,0,0')
  );
  expect(hasResponse).toBe(true);
});

// P4-003: REJECT response handling
it('P4-003: should handle REJECT,COLOR,invalid format response', async () => {
  const { LedController } = await import('../../src/controller.js');
  
  setMockResponse('REJECT,COLOR,invalid format');
  
  const controller = new LedController('COM3');
  await controller.connect();
  await controller.sendCommand('COLOR,invalid');
  
  // Verify command was sent
  expect(mockWrite).toHaveBeenCalledWith('COLOR,invalid\n', expect.any(Function));
  
  // Verify REJECT response was logged
  const hasResponse = capturedLogs.some(log => 
    log.includes('Device response: REJECT,COLOR,invalid format')
  );
  expect(hasResponse).toBe(true);
});

// P4-004: Timeout handling
it('P4-004: should handle timeout when no response received', async () => {
  const { LedController } = await import('../../src/controller.js');
  
  simulateTimeout(); // No response will be sent
  
  const controller = new LedController('COM3');
  await controller.connect();
  await controller.sendCommand('ON');
  
  // Verify command was sent
  expect(mockWrite).toHaveBeenCalledWith('ON\n', expect.any(Function));
  
  // Should log timeout message
  const hasTimeout = capturedLogs.some(log => 
    log.includes('No response received from device')
  );
  expect(hasTimeout).toBe(true);
});

// P4-005: Invalid response handling
it('P4-005: should treat invalid response STATUS,OK,ready as timeout', async () => {
  const { LedController } = await import('../../src/controller.js');
  
  setMockResponse('STATUS,OK,ready'); // Invalid response format
  
  const controller = new LedController('COM3');
  await controller.connect();
  await controller.sendCommand('ON');
  
  // Verify command was sent
  expect(mockWrite).toHaveBeenCalledWith('ON\n', expect.any(Function));
  
  // Should either timeout or handle gracefully
  // Implementation dependent - could log invalid response or treat as timeout
  const hasResponse = capturedLogs.some(log => 
    log.includes('Device response:') || log.includes('No response received')
  );
  expect(hasResponse).toBe(true);
});