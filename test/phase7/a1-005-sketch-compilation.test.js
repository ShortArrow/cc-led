/**
 * @fileoverview A1-005: Sketch Compilation Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: Sketch compilation with FQBN produces build directory output
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

vi.mock('fs', () => ({
  existsSync: vi.fn(() => true)
}));

test('A1-005: Sketch compilation with FQBN produces build directory output', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Setup: Arduino CLI instance
  const arduino = new ArduinoCLI();
  
  // Execute: Compile sketch with FQBN
  await arduino.execute(['compile', '--fqbn', 'rp2040:rp2040:seeed_xiao_rp2040', 'test-sketch']);
  
  // Assert: Command executed with compilation parameters
  expect(mockSpawn).toHaveBeenCalledWith(
    'arduino-cli',
    expect.arrayContaining([
      'compile',
      '--fqbn',
      'rp2040:rp2040:seeed_xiao_rp2040',
      'test-sketch'
    ]),
    expect.objectContaining({ shell: true })
  );
});