/**
 * @fileoverview Digital LED Protocol Tests (Phase 5)
 * 
 * Tests Digital LED boards that don't support colors but show warnings.
 * Covers Test-Matrix.md P5-001 through P5-004.
 * 
 * Uses stateless mock design - no beforeEach cleanup required.
 */

import { test, expect, vi } from 'vitest';

// Simple stateless mock - no state to clear between tests
const capturedCommands = [];
const capturedLogs = [];

// Stateless mock setup - define mock inline to avoid hoisting issues
vi.mock('serialport', () => ({
  SerialPort: class MockSerialPort {
    constructor(config, callback) {
      this.config = config;
      this.isOpen = true;
      if (callback) setImmediate(() => callback(null));
    }

    write(data, callback) {
      // Capture command for verification (stateless)
      capturedCommands.push(data);
      console.log(`Sent command: ${data.replace('\n', '')}`);
      
      if (callback) callback();
      
      // Always respond with ACCEPTED for simplicity
      setImmediate(() => {
        const response = 'ACCEPTED,TEST';
        console.log(`Device response: ${response}`);
        if (this.dataHandler) {
          this.dataHandler(Buffer.from(response));
        }
      });
    }

    on(event, handler) {
      if (event === 'data') {
        this.dataHandler = handler;
      }
    }

    off(event, handler) {
      if (event === 'data') {
        this.dataHandler = null;
      }
    }

    close(callback) {
      this.isOpen = false;
      if (callback) callback();
    }
  }
}));

vi.mock('../../src/utils/config.js', () => ({
  getSerialPort: vi.fn(() => 'COM3')
}));

// Capture console.log output
const originalConsoleLog = console.log;
console.log = (...args) => {
  capturedLogs.push(args.join(' '));
  originalConsoleLog(...args);
};

import { LedController } from '../../src/controller.js';

// Phase 5: Digital LED Protocol Tests

// P5-001: Digital board should show color warning but send command
test('P5-001: should show color warning and send command for red on digital board', async () => {
  const startIndex = capturedCommands.length;
  const startLogIndex = capturedLogs.length;
  
  // Mock digital LED board
  const mockBoard = {
    getLedProtocol: () => 'Digital',
    config: { serial: { baudRate: 9600 } }
  };
  
  const controller = new LedController('COM3', { board: mockBoard });
  await controller.connect();
  await controller.setColor('red');
  
  // Verify warning was shown
  const newLogs = capturedLogs.slice(startLogIndex);
  const hasWarning = newLogs.some(log => 
    log.includes('Digital LED does not support colors')
  );
  expect(hasWarning).toBe(true);
  
  // Command should still be sent
  const newCommands = capturedCommands.slice(startIndex);
  expect(newCommands).toContain('COLOR,255,0,0\n');
});

// P5-002: Digital board should show no warning for white color
test('P5-002: should show no warning for white color on digital board', async () => {
  const startIndex = capturedCommands.length;
  const startLogIndex = capturedLogs.length;
  
  // Mock digital LED board
  const mockBoard = {
    getLedProtocol: () => 'Digital',
    config: { serial: { baudRate: 9600 } }
  };
  
  const controller = new LedController('COM3', { board: mockBoard });
  await controller.connect();
  await controller.setColor('white');
  
  // No warning should be shown for white (check only this test's logs)
  const newLogs = capturedLogs.slice(startLogIndex);
  const hasWarning = newLogs.some(log => 
    log.includes('Digital LED does not support colors') && 
    log.includes("Color 'white'")
  );
  expect(hasWarning).toBe(false);
  
  // Command should be sent normally
  const newCommands = capturedCommands.slice(startIndex);
  expect(newCommands).toContain('COLOR,255,255,255\n');
});

// P5-003: Digital board should show rainbow warning
test('P5-003: should show rainbow warning on digital board', async () => {
  const startIndex = capturedCommands.length;
  const startLogIndex = capturedLogs.length;
  
  // Mock digital LED board
  const mockBoard = {
    getLedProtocol: () => 'Digital',
    config: { serial: { baudRate: 9600 } }
  };
  
  const controller = new LedController('COM3', { board: mockBoard });
  await controller.connect();
  await controller.rainbow(100);
  
  // Check for rainbow warning
  const newLogs = capturedLogs.slice(startLogIndex);
  const hasWarning = newLogs.some(log => 
    log.includes('Digital LED does not support rainbow effect')
  );
  expect(hasWarning).toBe(true);
  
  // Command should still be sent
  const newCommands = capturedCommands.slice(startIndex);
  expect(newCommands).toContain('RAINBOW,100\n');
});

// P5-004: Digital board should show two-color blink warning
test('P5-004: should show two-color blink warning on digital board', async () => {
  const startIndex = capturedCommands.length;
  const startLogIndex = capturedLogs.length;
  
  // Mock digital LED board
  const mockBoard = {
    getLedProtocol: () => 'Digital',
    config: { serial: { baudRate: 9600 } }
  };
  
  const controller = new LedController('COM3', { board: mockBoard });
  await controller.connect();
  await controller.blink2Colors('red', 'blue', 500);
  
  // Check for multi-color blink warning
  const newLogs = capturedLogs.slice(startLogIndex);
  const hasWarning = newLogs.some(log => 
    log.includes('Digital LED does not support multi-color blinking')
  );
  expect(hasWarning).toBe(true);
  
  // Command should still be sent
  const newCommands = capturedCommands.slice(startIndex);
  expect(newCommands).toContain('BLINK2,255,0,0,0,0,255,500\n');
});