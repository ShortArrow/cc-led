/**
 * @fileoverview A1-012: Log Level Propagation Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: Log level passed to all commands consistently
 */

import { test, expect, vi } from 'vitest';
import { ArduinoCLI } from '../../src/arduino.js';

// Mock child_process.spawn with hoisting-safe approach
vi.mock('child_process', () => ({
  spawn: vi.fn()
}));

import { spawn } from 'child_process';
const mockSpawn = vi.mocked(spawn);

// Setup mock behavior
mockSpawn.mockReturnValue({
  on: vi.fn((event, handler) => {
    if (event === 'close') {
      setImmediate(() => handler(0)); // Success exit code
    }
  }),
  stdout: { on: vi.fn() },
  stderr: { on: vi.fn() }
});

vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn()
}));

vi.mock('path', () => ({
  join: vi.fn((...args) => args.join('/').replace(/\/+/g, '/')),
  dirname: vi.fn((p) => p.split('/').slice(0, -1).join('/') || '/'),
  resolve: vi.fn((...args) => args.join('/').replace(/\/+/g, '/'))
}));

test('A1-012: Log level propagated consistently to all arduino-cli commands', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Setup: Arduino CLI instance
  const arduino = new ArduinoCLI();
  
  // Execute: Multiple commands (should all have consistent log level)
  await arduino.execute(['version'], 'debug');
  await arduino.execute(['core', 'list'], 'debug');
  await arduino.execute(['compile', 'sketch'], 'debug');
  
  // Assert: All commands received debug log level
  expect(mockSpawn).toHaveBeenCalledTimes(3);
  
  // Check each command has consistent log level parameters
  for (let i = 1; i <= 3; i++) {
    const [command, args] = mockSpawn.mock.calls[i-1];
    expect(command).toBe('arduino-cli');
    expect(args).toEqual(expect.arrayContaining(['--log', '--log-level', 'debug']));
  }
});