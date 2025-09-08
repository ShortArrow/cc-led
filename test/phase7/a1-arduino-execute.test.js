/**
 * @fileoverview A1-001 to A1-004: Arduino CLI Execute Tests with Dependency Injection
 * 
 * Tests low-level Arduino CLI command execution using Clean Architecture principles.
 * Uses interface-based mocks instead of module mocks for better isolation.
 */

import { it, expect, vi } from 'vitest';
import { ArduinoService } from '../../src/arduino.js';
import { MockFileSystemAdapter } from '../adapters/mock-file-system.adapter.js';
import { MockProcessExecutorAdapter } from '../adapters/mock-process-executor.adapter.js';

it('A1-001: should pass configuration file and arguments to arduino-cli and return stdout on success', async () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockProcessExecutor = new MockProcessExecutorAdapter();
  
  // Setup: successful execution with output
  mockProcessExecutor.setSpawnBehavior(
    mockProcessExecutor.createSuccessSpawn('Version info', '')
  );
  
  // Create service with mocked dependencies
  const arduino = new ArduinoService(mockFileSystem, mockProcessExecutor);
  
  const result = await arduino.execute(['version']);
  
  expect(result).toBe('Version info');
  
  const spawnCalls = mockProcessExecutor.getSpawnCalls();
  expect(spawnCalls).toHaveLength(1);
  expect(spawnCalls[0].command).toBe('arduino-cli');
  expect(spawnCalls[0].args).toEqual(
    expect.arrayContaining(['--log', '--log-level', 'info', '--config-file'])
  );
  expect(spawnCalls[0].args).toEqual(expect.arrayContaining(['version']));
  expect(spawnCalls[0].options).toEqual(
    expect.objectContaining({
      cwd: expect.any(String),
      shell: true
    })
  );
});

it('A1-002: should include log level parameter when provided', async () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockProcessExecutor = new MockProcessExecutorAdapter();
  
  // Setup: successful execution with debug output
  mockProcessExecutor.setSpawnBehavior(
    mockProcessExecutor.createSuccessSpawn('Debug info', '')
  );
  
  // Create service with mocked dependencies
  const arduino = new ArduinoService(mockFileSystem, mockProcessExecutor);
  
  await arduino.execute(['version'], 'debug');
  
  const spawnCalls = mockProcessExecutor.getSpawnCalls();
  expect(spawnCalls).toHaveLength(1);
  
  const call = spawnCalls[0];
  expect(call.command).toBe('arduino-cli');
  expect(call.args).toEqual(expect.arrayContaining(['--log', '--log-level', 'debug']));
  expect(call.args).toEqual(expect.arrayContaining(['version']));
});

it('A1-003: should default to info log level when no level specified', async () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockProcessExecutor = new MockProcessExecutorAdapter();
  
  // Setup: successful execution with info output
  mockProcessExecutor.setSpawnBehavior(
    mockProcessExecutor.createSuccessSpawn('Info output', '')
  );
  
  // Create service with mocked dependencies
  const arduino = new ArduinoService(mockFileSystem, mockProcessExecutor);
  
  await arduino.execute(['version']); // No log level specified
  
  const spawnCalls = mockProcessExecutor.getSpawnCalls();
  expect(spawnCalls).toHaveLength(1);
  
  const call = spawnCalls[0];
  expect(call.command).toBe('arduino-cli');
  expect(call.args).toEqual(expect.arrayContaining(['--log', '--log-level', 'info']));
});

it('A1-004: should throw an error with stderr content when arduino-cli returns non-zero exit code', async () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockProcessExecutor = new MockProcessExecutorAdapter();
  
  // Setup: failure execution with error
  const errorMessage = 'Command not found';
  mockProcessExecutor.setSpawnBehavior(
    mockProcessExecutor.createFailureSpawn(1, errorMessage)
  );
  
  // Create service with mocked dependencies
  const arduino = new ArduinoService(mockFileSystem, mockProcessExecutor);
  
  await expect(arduino.execute(['invalid-command']))
    .rejects.toThrow('Command failed with code 1');
  
  const spawnCalls = mockProcessExecutor.getSpawnCalls();
  expect(spawnCalls).toHaveLength(1);
  expect(spawnCalls[0].command).toBe('arduino-cli');
  expect(spawnCalls[0].args).toEqual(expect.arrayContaining(['invalid-command']));
});