/**
 * @fileoverview A1-006: Sketch Directory Validation Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: Sketch directory validation checks directory existence
 */

import { test, expect, vi } from 'vitest';
import { ArduinoCLI } from '../../src/arduino.js';

// Mock child_process.spawn
const mockSpawn = vi.fn();
mockSpawn.mockReturnValue({
  on: vi.fn((event, handler) => {
    if (event === 'close') {
      setImmediate(() => handler(0)); // Success exit code
    }
  }),
  stdout: { on: vi.fn() },
  stderr: { on: vi.fn() }
});

vi.mock('child_process', () => ({
  spawn: mockSpawn
}));

// Mock fs.existsSync to return false (directory doesn't exist)
const mockExistsSync = vi.fn(() => false);
vi.mock('fs', () => ({
  existsSync: mockExistsSync
}));

test('A1-006: Sketch directory validation checks directory existence', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Setup: Arduino CLI instance
  const arduino = new ArduinoCLI();
  
  // Execute & Assert: Should throw error for non-existent directory
  await expect(
    arduino.compile('non-existent-sketch', 'rp2040:rp2040:seeed_xiao_rp2040')
  ).rejects.toThrow('Sketch directory does not exist');
  
  // Verify directory check was performed
  expect(mockExistsSync).toHaveBeenCalled();
});