/**
 * @fileoverview P3-012: Environment Variable Fallback Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: No CLI arg, env var set => env var used
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

test('P3-012: No CLI arg with SERIAL_PORT=COM7 env var uses environment fallback', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  portInstances.clear();
  
  // Setup: Set environment variable, no CLI port
  const originalPort = process.env.SERIAL_PORT;
  process.env.SERIAL_PORT = 'COM7';
  
  // Execute: No port specified in options (should fall back to env var)
  await executeCommand({ on: true }); // No port specified
  
  // Assert: COM7 from env var was used
  expect(portInstances.has('COM7')).toBe(true);
  
  // Restore
  process.env.SERIAL_PORT = originalPort;
});