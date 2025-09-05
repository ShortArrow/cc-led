/**
 * @fileoverview P3-011: CLI Port Priority Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: CLI arg overrides SERIAL_PORT environment variable
 */

import { test, expect, vi } from 'vitest';
import { executeCommand } from '../../src/controller.js';

// Mock SerialPort with port tracking
const mockWrite = vi.fn((data, callback) => {
  if (callback) callback();
});

const portInstances = new Map();

vi.mock('serialport', () => ({
  SerialPort: vi.fn((config, callback) => {
    const instance = {
      write: mockWrite,
      close: vi.fn((callback) => { if (callback) callback(); }),
      on: vi.fn((event, handler) => {
        if (event === 'data') {
          setImmediate(() => handler(Buffer.from('ACCEPTED,TEST')));
        }
      }),
      off: vi.fn(),
      isOpen: true,
      path: config.path
    };
    portInstances.set(config.path, instance);
    if (callback) setImmediate(() => callback(null));
    return instance;
  })
}));

vi.mock('../../src/utils/config.js', () => ({
  getSerialPort: vi.fn(() => process.env.SERIAL_PORT || 'COM_DEFAULT')
}));

test('P3-011: CLI --port COM3 overrides SERIAL_PORT=COM5 environment variable', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  portInstances.clear();
  
  // Setup: Set environment variable
  const originalPort = process.env.SERIAL_PORT;
  process.env.SERIAL_PORT = 'COM5';
  
  // Execute: CLI arg should override env var
  await executeCommand({ port: 'COM3', on: true });
  
  // Assert: COM3 was used (not COM5 from env var)
  expect(portInstances.has('COM3')).toBe(true);
  expect(portInstances.has('COM5')).toBe(false);
  
  // Restore
  process.env.SERIAL_PORT = originalPort;
});