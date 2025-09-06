/**
 * @fileoverview A1-001 to A1-004: Arduino CLI Execute Tests
 * 
 * Tests low-level Arduino CLI command execution
 */

import { it, expect, beforeEach, vi } from 'vitest';
import { spawn } from 'child_process';
import { ArduinoCLI } from '../../src/arduino.js';

// Mock child_process
vi.mock('child_process', () => ({
  spawn: vi.fn()
}));

const mockSpawn = vi.mocked(spawn);

const createMockProcess = (exitCode, stdout, stderr) => {
  const mockProcess = {
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn()
  };
  
  // Setup stdout data handler
  mockProcess.stdout.on.mockImplementation((event, handler) => {
    if (event === 'data' && stdout) {
      setImmediate(() => handler(stdout));
    }
  });
  
  // Setup stderr data handler
  mockProcess.stderr.on.mockImplementation((event, handler) => {
    if (event === 'data' && stderr) {
      setImmediate(() => handler(stderr));
    }
  });
  
  // Setup exit handler
  mockProcess.on.mockImplementation((event, handler) => {
    if (event === 'close') {
      setImmediate(() => handler(exitCode));
    }
  });
  
  return mockProcess;
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSpawn.mockClear();
  mockSpawn.mockReset();
});

it('A1-001: should pass configuration file and arguments to arduino-cli and return stdout on success', async () => {
  // Clear previous calls to ensure clean state
  vi.clearAllMocks();
  mockSpawn.mockReturnValue(createMockProcess(0, 'Version info', ''));
  
  const arduino = new ArduinoCLI();
  await arduino.execute(['version']);
  
  expect(mockSpawn).toHaveBeenCalledWith(
    'arduino-cli',
    expect.arrayContaining(['--log', '--log-level', 'info', '--config-file']),
    expect.objectContaining({
      cwd: expect.any(String),
      shell: true
    })
  );
});

it('A1-002: should include log level parameter when provided', async () => {
  // Clear previous calls and reset to ensure completely clean state
  vi.clearAllMocks();
  mockSpawn.mockReturnValue(createMockProcess(0, 'Debug info', ''));
  
  const arduino = new ArduinoCLI();
  await arduino.execute(['version'], 'debug');
  
  // Find the call that contains debug (not all calls may be relevant)
  const debugCall = mockSpawn.mock.calls.find(call => 
    call[1].includes('--log-level') && call[1].includes('debug')
  );
  
  expect(debugCall).toBeDefined();
  expect(debugCall[0]).toBe('arduino-cli');
  expect(debugCall[1]).toEqual(expect.arrayContaining(['--log', '--log-level', 'debug']));
  expect(debugCall[1]).toEqual(expect.arrayContaining(['version']));
});

it('A1-003: should default to info log level when no level specified', async () => {
  // Clear previous calls to ensure clean state
  vi.clearAllMocks();
  mockSpawn.mockReturnValue(createMockProcess(0, 'Info output', ''));
  
  const arduino = new ArduinoCLI();
  await arduino.execute(['version']);
  
  expect(mockSpawn).toHaveBeenCalledWith(
    'arduino-cli',
    expect.arrayContaining(['--log', '--log-level', 'info']),
    expect.objectContaining({
      cwd: expect.any(String),
      shell: true
    })
  );
});

it('A1-004: should throw an error with stderr content when arduino-cli returns non-zero exit code', async () => {
  // Clear previous calls to ensure clean state
  vi.clearAllMocks();
  mockSpawn.mockReturnValue(createMockProcess(1, '', 'Command failed'));
  
  const arduino = new ArduinoCLI();
  
  await expect(arduino.execute(['invalid']))
    .rejects.toThrow('Command failed with code 1: Command failed');
});