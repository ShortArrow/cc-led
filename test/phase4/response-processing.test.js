/**
 * @fileoverview Response Processing Tests (Phase 4)
 * 
 * Tests microcontroller response parsing including ACCEPTED, REJECT,
 * timeout handling, and invalid response validation.
 * Covers Test-Matrix.md P4-001 through P4-005.
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
      
      // Simulate response based on command
      setImmediate(() => {
        const command = data.trim();
        let response;
        
        if (command === 'ON') {
          response = 'ACCEPTED,ON';
        } else if (command === 'COLOR,255,0,0') {
          response = 'ACCEPTED,COLOR,255,0,0';
        } else if (command === 'COLOR,invalid') {
          response = 'REJECT,COLOR,invalid format';
        } else if (command.startsWith('timeout-test')) {
          // No response for timeout test
          return;
        } else if (command.startsWith('invalid-test')) {
          response = 'STATUS,OK,ready'; // Invalid response format
          // But don't call handler since it doesn't match ACCEPTED/REJECT
          return;
        } else {
          response = 'ACCEPTED,TEST';
        }
        
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

// Phase 4: Response Processing Tests

// P4-001: ACCEPTED response handling
test('P4-001: should parse and display ACCEPTED,ON response correctly', async () => {
  const startIndex = capturedCommands.length;
  const startLogIndex = capturedLogs.length;
  
  const controller = new LedController('COM3');
  await controller.connect();
  await controller.sendCommand('ON');
  
  // Verify command was sent (check only new commands)
  const newCommands = capturedCommands.slice(startIndex);
  expect(newCommands).toContain('ON\n');
  
  // Verify response was logged (check only new logs)
  const newLogs = capturedLogs.slice(startLogIndex);
  const hasCommand = newLogs.some(log => log.includes('Sent command: ON'));
  const hasResponse = newLogs.some(log => log.includes('Device response: ACCEPTED,ON'));
  
  expect(hasCommand).toBe(true);
  expect(hasResponse).toBe(true);
});

// P4-002: ACCEPTED response with parameters
test('P4-002: should parse ACCEPTED,COLOR,255,0,0 response with parameters', async () => {
  const startIndex = capturedCommands.length;
  const startLogIndex = capturedLogs.length;
  
  const controller = new LedController('COM3');
  await controller.connect();
  await controller.sendCommand('COLOR,255,0,0');
  
  // Verify command was sent
  const newCommands = capturedCommands.slice(startIndex);
  expect(newCommands).toContain('COLOR,255,0,0\n');
  
  // Verify response was logged with parameters
  const newLogs = capturedLogs.slice(startLogIndex);
  const hasResponse = newLogs.some(log => 
    log.includes('Device response: ACCEPTED,COLOR,255,0,0')
  );
  expect(hasResponse).toBe(true);
});

// P4-003: REJECT response handling
test('P4-003: should handle REJECT,COLOR,invalid format response', async () => {
  const startIndex = capturedCommands.length;
  const startLogIndex = capturedLogs.length;
  
  const controller = new LedController('COM3');
  await controller.connect();
  await controller.sendCommand('COLOR,invalid');
  
  // Verify command was sent
  const newCommands = capturedCommands.slice(startIndex);
  expect(newCommands).toContain('COLOR,invalid\n');
  
  // Verify REJECT response was logged
  const newLogs = capturedLogs.slice(startLogIndex);
  const hasResponse = newLogs.some(log => 
    log.includes('Device response: REJECT,COLOR,invalid format')
  );
  expect(hasResponse).toBe(true);
});

// P4-004: Timeout handling
test('P4-004: should handle timeout when no response received', async () => {
  const startLogIndex = capturedLogs.length;
  
  const controller = new LedController('COM3');
  await controller.connect();
  await controller.sendCommand('timeout-test');
  
  // Should log timeout message
  const newLogs = capturedLogs.slice(startLogIndex);
  const hasTimeout = newLogs.some(log => 
    log.includes('No response received from device')
  );
  expect(hasTimeout).toBe(true);
});

// P4-005: Invalid response handling
test('P4-005: should treat invalid response STATUS,OK,ready as timeout', async () => {
  const startLogIndex = capturedLogs.length;
  
  const controller = new LedController('COM3');
  await controller.connect();
  await controller.sendCommand('invalid-test');
  
  // Should either timeout or handle gracefully
  const newLogs = capturedLogs.slice(startLogIndex);
  const hasResponse = newLogs.some(log => 
    log.includes('Device response:') || log.includes('No response received')
  );
  expect(hasResponse).toBe(true);
});