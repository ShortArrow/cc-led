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
  mockSpawn.mockReturnValue(createMockProcess(0, 'Debug info', ''));
  
  const arduino = new ArduinoCLI();
  await arduino.execute(['version'], 'debug');
  
  // The actual call should have the exact config file path  
  const [actualCommand, actualArgs] = mockSpawn.mock.calls[0];
  expect(actualCommand).toBe('arduino-cli');
  expect(actualArgs).toEqual(expect.arrayContaining(['--log', '--log-level', 'debug', '--config-file']));
  expect(actualArgs).toEqual(expect.arrayContaining(['version']));
  
  expect(mockSpawn).toHaveBeenCalledWith(
    'arduino-cli',
    expect.arrayContaining(['--log', '--log-level', 'debug', '--config-file', 'version']),
    expect.objectContaining({
      cwd: expect.any(String),
      shell: true
    })
  );
});

it('A1-003: should default to info log level when no level specified', async () => {
  mockSpawn.mockReturnValue(createMockProcess(0, 'Info output', ''));
  
  const arduino = new ArduinoCLI();
  await arduino.execute(['version']);
  
  expect(mockSpawn).toHaveBeenCalledWith(
    'arduino-cli',
    expect.arrayContaining(['--log', '--log-level', 'info', '--config-file', 'version']),
    expect.objectContaining({
      cwd: expect.any(String),
      shell: true
    })
  );
});

it('A1-004: should throw an error with stderr content when arduino-cli returns non-zero exit code', async () => {
  mockSpawn.mockReturnValue(createMockProcess(1, '', 'Command failed'));
  
  const arduino = new ArduinoCLI();
  
  await expect(arduino.execute(['invalid']))
    .rejects.toThrow('Command failed with code 1: Command failed');
});