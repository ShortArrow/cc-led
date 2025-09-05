/**
 * @fileoverview A1-008: Port Fallback Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: Upload without port specification uses default
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

test('A1-008: Upload without port specification uses configuration default', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Setup: Arduino CLI instance
  const arduino = new ArduinoCLI();
  
  // Execute: Upload without explicit port (should use default behavior)
  await arduino.execute(['upload', '--fqbn', 'rp2040:rp2040:seeed_xiao_rp2040', 'test-sketch']);
  
  // Assert: Command executed without explicit port (Arduino CLI handles default)
  expect(mockSpawn).toHaveBeenCalledWith(
    'arduino-cli',
    expect.arrayContaining([
      'upload',
      '--fqbn',
      'rp2040:rp2040:seeed_xiao_rp2040',
      'test-sketch'
    ]),
    expect.objectContaining({ shell: true })
  );
  
  // Verify port was not explicitly specified
  const [, args] = mockSpawn.mock.calls[0];
  expect(args).not.toContain('--port');
});