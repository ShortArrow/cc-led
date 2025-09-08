/**
 * @fileoverview Serial Port Mock Factory
 * 
 * Self-contained mock factory for serial port testing following Test-Matrix.md guidelines.
 * Provides simple, inline mock creation without complex abstractions.
 */

import { vi } from 'vitest';

/**
 * Creates a basic SerialPort mock for command testing
 * Usage: const mockSerialPort = createBasicSerialMock();
 */
export function createBasicSerialMock() {
  const mockWrite = vi.fn((data, callback) => {
    if (callback) callback();
  });

  const mockSerialPortInstance = {
    write: mockWrite,
    close: vi.fn((callback) => { if (callback) callback(); }),
    on: vi.fn((event, handler) => {
      if (event === 'data') {
        setImmediate(() => handler(Buffer.from('ACCEPTED,TEST')));
      }
    }),
    off: vi.fn(),
    isOpen: true
  };

  vi.mock('serialport', () => ({
    SerialPort: vi.fn((config, callback) => {
      if (callback) setImmediate(() => callback(null));
      return mockSerialPortInstance;
    })
  }));

  return { mockWrite, mockSerialPortInstance };
}

/**
 * Creates SerialPort mock with specific response
 * Usage: const mockSerialPort = createSerialMockWithResponse('ACCEPTED,ON');
 */
export function createSerialMockWithResponse(response) {
  const mockWrite = vi.fn((data, callback) => {
    if (callback) callback();
  });

  const mockSerialPortInstance = {
    write: mockWrite,
    close: vi.fn((callback) => { if (callback) callback(); }),
    on: vi.fn((event, handler) => {
      if (event === 'data') {
        setImmediate(() => handler(Buffer.from(response)));
      }
    }),
    off: vi.fn(),
    isOpen: true
  };

  vi.mock('serialport', () => ({
    SerialPort: vi.fn((config, callback) => {
      if (callback) setImmediate(() => callback(null));
      return mockSerialPortInstance;
    })
  }));

  return { mockWrite, mockSerialPortInstance };
}

/**
 * Creates SerialPort mock with no response (timeout scenario)
 * Usage: const mockSerialPort = createSerialMockWithNoResponse();
 */
export function createSerialMockWithNoResponse() {
  const mockWrite = vi.fn((data, callback) => {
    if (callback) callback();
  });

  const mockSerialPortInstance = {
    write: mockWrite,
    close: vi.fn((callback) => { if (callback) callback(); }),
    on: vi.fn(), // No response handler
    off: vi.fn(),
    isOpen: true
  };

  vi.mock('serialport', () => ({
    SerialPort: vi.fn((config, callback) => {
      if (callback) setImmediate(() => callback(null));
      return mockSerialPortInstance;
    })
  }));

  return { mockWrite, mockSerialPortInstance };
}

/**
 * Basic config mock for testing
 * Usage: mockConfig();
 */
export function mockConfig() {
  vi.mock('../../src/utils/config.js', () => ({
    getSerialPort: vi.fn(() => 'COM3'),
    loadConfig: vi.fn(() => ({ 
      serialPort: 'COM3',
      arduinoConfigFile: './arduino-cli.yaml',
      fqbn: 'rp2040:rp2040:seeed_xiao_rp2040'
    }))
  }));
}