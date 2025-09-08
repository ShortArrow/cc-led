/**
 * @fileoverview A1-011: Legacy Installation Fallback Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: Installation without board configuration uses legacy approach
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

test('A1-011: Installation without board uses legacy fallback mechanism', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Setup: Arduino CLI instance
  const arduino = new ArduinoCLI();
  
  // Execute: Generic installation without board-specific configuration
  await arduino.execute(['core', 'update-index']);
  await arduino.execute(['lib', 'update-index']);
  
  // Assert: Legacy fallback commands executed
  expect(mockSpawn).toHaveBeenCalledTimes(2);
  
  expect(mockSpawn).toHaveBeenNthCalledWith(1,
    'arduino-cli',
    expect.arrayContaining(['core', 'update-index']),
    expect.objectContaining({ shell: true })
  );
  
  expect(mockSpawn).toHaveBeenNthCalledWith(2,
    'arduino-cli',
    expect.arrayContaining(['lib', 'update-index']),
    expect.objectContaining({ shell: true })
  );
});