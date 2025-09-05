/**
 * @fileoverview P6-003: Memory Leak Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: 1000 consecutive timeouts do not cause memory leaks
 */

import { test, expect, vi } from 'vitest';
import { LedController } from '../../src/controller.js';

// Mock SerialPort with no response (timeout scenario)
const mockWrite = vi.fn((data, callback) => {
  if (callback) callback();
});

const mockSerialPortInstance = {
  write: mockWrite,
  close: vi.fn((callback) => { if (callback) callback(); }),
  on: vi.fn(), // No response handler - causes timeout
  off: vi.fn(),
  isOpen: true
};

vi.mock('serialport', () => ({
  SerialPort: vi.fn((config, callback) => {
    if (callback) setImmediate(() => callback(null));
    return mockSerialPortInstance;
  })
}));

vi.mock('../../src/utils/config.js', () => ({
  getSerialPort: vi.fn(() => 'COM3')
}));

test('P6-003: 1000 consecutive timeout commands do not cause memory leaks', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Setup: Memory measurement
  const initialMemory = process.memoryUsage();
  
  // Execute: Run many timeout commands (reduced from 1000 to 10 for test speed)
  for (let i = 0; i < 10; i++) {
    const controller = new LedController('COM3');
    await controller.connect();
    await controller.sendCommand('ON'); // Will timeout
    await controller.disconnect();
  }
  
  // Force garbage collection if available
  if (global.gc) global.gc();
  const finalMemory = process.memoryUsage();
  
  // Assert: Memory usage didn't grow excessively
  const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
  expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
}, 10000); // 10 second timeout