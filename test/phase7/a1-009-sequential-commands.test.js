/**
 * @fileoverview A1-009: Sequential Arduino CLI Commands Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: Three arduino-cli commands in sequence succeed
 */

import { test, expect, vi } from 'vitest';
import { ArduinoCLI } from '../../src/arduino.js';

// Mock child_process.spawn with hoisting-safe approach
let callCount = 0;

vi.mock('child_process', () => ({
  spawn: vi.fn()
}));

import { spawn } from 'child_process';
const mockSpawn = vi.mocked(spawn);

// Setup mock behavior
mockSpawn.mockImplementation(() => {
  callCount++;
  return {
    on: vi.fn((event, handler) => {
      if (event === 'close') {
        setImmediate(() => handler(0)); // Success exit code
      }
    }),
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() }
  };
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

test('A1-009: Three sequential arduino-cli commands all succeed', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  callCount = 0;
  
  // Setup: Arduino CLI instance
  const arduino = new ArduinoCLI();
  
  // Execute: Three sequential commands
  await arduino.execute(['version']);
  await arduino.execute(['core', 'list']);
  await arduino.execute(['lib', 'list']);
  
  // Assert: All three commands were executed
  expect(mockSpawn).toHaveBeenCalledTimes(3);
  
  // Verify each command
  expect(mockSpawn).toHaveBeenNthCalledWith(1, 
    'arduino-cli',
    expect.arrayContaining(['version']),
    expect.objectContaining({ shell: true })
  );
  
  expect(mockSpawn).toHaveBeenNthCalledWith(2,
    'arduino-cli', 
    expect.arrayContaining(['core', 'list']),
    expect.objectContaining({ shell: true })
  );
  
  expect(mockSpawn).toHaveBeenNthCalledWith(3,
    'arduino-cli',
    expect.arrayContaining(['lib', 'list']), 
    expect.objectContaining({ shell: true })
  );
});