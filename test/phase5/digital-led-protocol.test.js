/**
 * @fileoverview Digital LED Protocol Tests (Phase 5)
 * 
 * Tests Digital LED boards that don't support colors but show warnings.
 * Covers Test-Matrix.md P5-001 through P5-004.
 * 
 * Following Zenn article best practices for self-contained tests without timeouts.
 */

import { it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock console methods to capture output
const originalConsoleLog = console.log;
const capturedLogs = [];

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
  capturedLogs.length = 0;
  console.log = (...args) => {
    capturedLogs.push(args.join(' '));
    originalConsoleLog(...args);
  };
});

afterEach(() => {
  console.log = originalConsoleLog;
});

// Phase 5: Digital LED Protocol Tests

// P5-001: Digital board should show color warning for red
it('P5-001: should show color warning and send command for red on digital board', async () => {
  const { LedController } = await import('../../src/controller.js');
  
  // Mock digital LED board
  const mockBoard = {
    getLedProtocol: () => 'Digital',
    config: { serial: { baudRate: 9600 } }
  };
  
  const controller = new LedController('COM3', { board: mockBoard });
  await controller.connect();
  await controller.setColor('red');
  
  // Check for warning log
  const hasWarning = capturedLogs.some(log => 
    log.includes('Digital LED does not support colors') && log.includes('red')
  );
  expect(hasWarning).toBe(true);
  
  // Command should still be sent
  expect(mockWrite).toHaveBeenCalledWith('COLOR,255,0,0\n', expect.any(Function));
});

// P5-002: Digital board should show no warning for white color
it('P5-002: should show no warning for white color on digital board', async () => {
  const { LedController } = await import('../../src/controller.js');
  
  // Mock digital LED board
  const mockBoard = {
    getLedProtocol: () => 'Digital',
    config: { serial: { baudRate: 9600 } }
  };
  
  const controller = new LedController('COM3', { board: mockBoard });
  await controller.connect();
  await controller.setColor('white');
  
  // Should not show warning for white (default color)
  const hasWarning = capturedLogs.some(log => 
    log.includes('Digital LED does not support colors')
  );
  expect(hasWarning).toBe(false);
  
  // Command should be sent normally
  expect(mockWrite).toHaveBeenCalledWith('COLOR,255,255,255\n', expect.any(Function));
});

// P5-003: Digital board should show rainbow warning
it('P5-003: should show rainbow warning on digital board', async () => {
  const { LedController } = await import('../../src/controller.js');
  
  // Mock digital LED board
  const mockBoard = {
    getLedProtocol: () => 'Digital',
    config: { serial: { baudRate: 9600 } }
  };
  
  const controller = new LedController('COM3', { board: mockBoard });
  await controller.connect();
  await controller.rainbow(100);
  
  // Check for rainbow warning
  const hasWarning = capturedLogs.some(log => 
    log.includes('Digital LED does not support rainbow effect')
  );
  expect(hasWarning).toBe(true);
  
  // Command should still be sent
  expect(mockWrite).toHaveBeenCalledWith('RAINBOW,100\n', expect.any(Function));
});

// P5-004: Digital board should show two-color blink warning
it('P5-004: should show two-color blink warning on digital board', async () => {
  const { LedController } = await import('../../src/controller.js');
  
  // Mock digital LED board
  const mockBoard = {
    getLedProtocol: () => 'Digital',
    config: { serial: { baudRate: 9600 } }
  };
  
  const controller = new LedController('COM3', { board: mockBoard });
  await controller.connect();
  await controller.blink2Colors('red', 'blue', 500);
  
  // Check for two-color blink warning
  const hasWarning = capturedLogs.some(log => 
    log.includes('Digital LED does not support multi-color blinking')
  );
  expect(hasWarning).toBe(true);
  
  // Command should still be sent
  expect(mockWrite).toHaveBeenCalledWith('BLINK2,255,0,0,0,0,255,500\n', expect.any(Function));
});