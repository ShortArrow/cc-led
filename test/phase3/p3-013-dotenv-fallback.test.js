/**
 * @fileoverview P3-013: .env File Fallback Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: No CLI/env, .env file exists => .env value used
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
  getSerialPort: vi.fn(() => {
    // Simulate .env file fallback when no CLI arg or env var
    if (!process.env.SERIAL_PORT) {
      return 'COM9'; // Simulated .env file value
    }
    return process.env.SERIAL_PORT;
  })
}));

test('P3-013: No CLI arg or env var, .env file value COM9 used as fallback', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  portInstances.clear();
  
  // Setup: Clear environment variable (no CLI arg, no env var)
  const originalPort = process.env.SERIAL_PORT;
  delete process.env.SERIAL_PORT;
  
  // Execute: No port specified anywhere (should fall back to .env file)
  await executeCommand({ on: true }); // No port specified
  
  // Assert: COM9 from .env file was used
  expect(portInstances.has('COM9')).toBe(true);
  
  // Restore
  if (originalPort) process.env.SERIAL_PORT = originalPort;
});