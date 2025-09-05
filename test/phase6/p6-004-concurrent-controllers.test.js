/**
 * @fileoverview P6-004: Concurrent Controllers Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: Multiple controllers on different ports run without interference
 */

import { test, expect, vi } from 'vitest';
import { LedController } from '../../src/controller.js';

// Mock SerialPort with port-specific responses
const mockWrite = vi.fn((data, callback) => {
  if (callback) callback();
});

const createMockPortInstance = (portName) => ({
  write: mockWrite,
  close: vi.fn((callback) => { if (callback) callback(); }),
  on: vi.fn((event, handler) => {
    if (event === 'data') {
      setImmediate(() => handler(Buffer.from(`ACCEPTED,${portName}`)));
    }
  }),
  off: vi.fn(),
  isOpen: true
});

vi.mock('serialport', () => ({
  SerialPort: vi.fn((config, callback) => {
    if (callback) setImmediate(() => callback(null));
    return createMockPortInstance(config.path);
  })
}));

vi.mock('../../src/utils/config.js', () => ({
  getSerialPort: vi.fn(() => 'COM3')
}));

test('P6-004: Multiple controllers on different ports run without interference', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Setup: Multiple controllers with different ports
  const controller1 = new LedController('COM3');
  const controller2 = new LedController('COM5');
  const controller3 = new LedController('COM7');
  
  await Promise.all([
    controller1.connect(),
    controller2.connect(),
    controller3.connect()
  ]);
  
  // Execute: Send commands concurrently
  const results = await Promise.all([
    controller1.setColor('red'),
    controller2.setColor('green'),
    controller3.setColor('blue')
  ]);
  
  // Assert: All operations completed successfully (no interference)
  expect(results).toHaveLength(3);
  expect(mockWrite).toHaveBeenCalledWith('COLOR,255,0,0\n', expect.any(Function));
  expect(mockWrite).toHaveBeenCalledWith('COLOR,0,255,0\n', expect.any(Function));
  expect(mockWrite).toHaveBeenCalledWith('COLOR,0,0,255\n', expect.any(Function));
  
  // Cleanup
  await Promise.all([
    controller1.disconnect(),
    controller2.disconnect(),
    controller3.disconnect()
  ]);
});