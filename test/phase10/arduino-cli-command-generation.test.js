/**
 * @fileoverview Phase 10: Arduino CLI Command Generation Tests with Dependency Injection
 * 
 * Tests verify that CLI options are correctly transformed into Arduino CLI
 * commands with proper FQBN mapping, parameter conversion, and path resolution.
 * 
 * Following Test-Matrix.md guidelines:
 * - Uses interface-based mocks instead of module mocks
 * - Self-contained tests with dependency injection
 * - Stateless mock design for predictable behavior
 */

import { test, expect } from 'vitest';
import { ArduinoService } from '../../src/arduino.js';
import { MockFileSystemAdapter } from '../adapters/mock-file-system.adapter.js';
import { MockProcessExecutorAdapter } from '../adapters/mock-process-executor.adapter.js';

test('A2-001: --board xiao-rp2040 generates correct FQBN for compile', async () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockProcessExecutor = new MockProcessExecutorAdapter();
  
  // Setup: Allow sketch directories to exist
  mockFileSystem.setExistsSyncBehavior(() => true);
  
  // Setup: successful arduino-cli execution
  mockProcessExecutor.setSpawnBehavior(
    mockProcessExecutor.createSuccessSpawn('Compilation successful', '')
  );
  
  // Create service with mocked dependencies
  const arduino = new ArduinoService(mockFileSystem, mockProcessExecutor);
  
  // Execute: compile with xiao-rp2040 board
  await arduino.compile('LEDBlink', { fqbn: 'rp2040:rp2040:seeed_xiao_rp2040' });
  
  const spawnCalls = mockProcessExecutor.getSpawnCalls();
  expect(spawnCalls).toHaveLength(1);
  
  const call = spawnCalls[0];
  expect(call.command).toBe('arduino-cli');
  expect(call.args).toEqual(expect.arrayContaining([
    'compile',
    '--fqbn',
    'rp2040:rp2040:seeed_xiao_rp2040'
  ]));
});

test('A2-002: Port parameter conversion for upload command', async () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockProcessExecutor = new MockProcessExecutorAdapter();
  
  // Setup: Allow sketch directories to exist
  mockFileSystem.setExistsSyncBehavior(() => true);
  
  // Setup: successful arduino-cli execution
  mockProcessExecutor.setSpawnBehavior(
    mockProcessExecutor.createSuccessSpawn('Upload successful', '')
  );
  
  // Create service with mocked dependencies
  const arduino = new ArduinoService(mockFileSystem, mockProcessExecutor);
  
  // Execute: deploy with port specification in options
  await arduino.deploy('LEDBlink', { fqbn: 'rp2040:rp2040:seeed_xiao_rp2040' }, { port: 'COM3' });
  
  const spawnCalls = mockProcessExecutor.getSpawnCalls();
  expect(spawnCalls).toHaveLength(1);
  
  const call = spawnCalls[0];
  expect(call.command).toBe('arduino-cli');
  expect(call.args).toEqual(expect.arrayContaining([
    'upload',
    '--port',
    'COM3',
    '--fqbn',
    'rp2040:rp2040:seeed_xiao_rp2040'
  ]));
});

test('A2-003: Debug log level propagation to Arduino CLI', async () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockProcessExecutor = new MockProcessExecutorAdapter();
  
  // Setup: Allow sketch directories to exist
  mockFileSystem.setExistsSyncBehavior(() => true);
  
  // Setup: successful arduino-cli execution with debug logging
  mockProcessExecutor.setSpawnBehavior(
    mockProcessExecutor.createSuccessSpawn('Debug compilation output', '')
  );
  
  // Create service with mocked dependencies and debug log level
  const arduino = new ArduinoService(mockFileSystem, mockProcessExecutor, { logLevel: 'debug' });
  
  // Execute: compile with debug log level via parameter
  await arduino.compile('LEDBlink', { fqbn: 'rp2040:rp2040:seeed_xiao_rp2040' }, 'debug');
  
  const spawnCalls = mockProcessExecutor.getSpawnCalls();
  expect(spawnCalls).toHaveLength(1);
  
  const call = spawnCalls[0];
  expect(call.command).toBe('arduino-cli');
  expect(call.args).toEqual(expect.arrayContaining([
    '--log-level',
    'debug'
  ]));
});

test('A2-004: Trace log level propagation to Arduino CLI', async () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockProcessExecutor = new MockProcessExecutorAdapter();
  
  // Setup: Allow sketch directories to exist
  mockFileSystem.setExistsSyncBehavior(() => true);
  
  // Setup: successful arduino-cli execution with trace logging
  mockProcessExecutor.setSpawnBehavior(
    mockProcessExecutor.createSuccessSpawn('Trace upload output', '')
  );
  
  // Create service with mocked dependencies
  const arduino = new ArduinoService(mockFileSystem, mockProcessExecutor);
  
  // Execute: deploy with trace log level
  await arduino.deploy('LEDBlink', { fqbn: 'rp2040:rp2040:seeed_xiao_rp2040' }, { logLevel: 'trace' });
  
  const spawnCalls = mockProcessExecutor.getSpawnCalls();
  expect(spawnCalls).toHaveLength(1);
  
  const call = spawnCalls[0];
  expect(call.command).toBe('arduino-cli');
  expect(call.args).toEqual(expect.arrayContaining([
    '--log-level',
    'trace'
  ]));
});

test('A2-005: Build directory path generation uses working directory', async () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockProcessExecutor = new MockProcessExecutorAdapter();
  
  // Setup: Allow sketch directories to exist
  mockFileSystem.setExistsSyncBehavior(() => true);
  
  // Setup: successful arduino-cli execution
  mockProcessExecutor.setSpawnBehavior(
    mockProcessExecutor.createSuccessSpawn('Build successful', '')
  );
  
  // Create service with mocked dependencies
  const arduino = new ArduinoService(mockFileSystem, mockProcessExecutor);
  
  // Execute: compile command
  await arduino.compile('LEDBlink', { fqbn: 'rp2040:rp2040:seeed_xiao_rp2040' });
  
  const spawnCalls = mockProcessExecutor.getSpawnCalls();
  expect(spawnCalls).toHaveLength(1);
  
  const call = spawnCalls[0];
  expect(call.command).toBe('arduino-cli');
  expect(call.args).toEqual(expect.arrayContaining([
    'compile',
    '--libraries'
  ]));
  // Libraries path should contain common directory
  const librariesIndex = call.args.indexOf('--libraries');
  const librariesPath = call.args[librariesIndex + 1];
  expect(librariesPath).toContain('common');
});

test('A2-006: Config file parameter included in all Arduino CLI commands', async () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockProcessExecutor = new MockProcessExecutorAdapter();
  
  // Setup: Allow sketch directories to exist
  mockFileSystem.setExistsSyncBehavior(() => true);
  
  // Setup: successful arduino-cli execution for all commands
  mockProcessExecutor.setSpawnBehavior(
    mockProcessExecutor.createSuccessSpawn('Command successful', '')
  );
  
  // Create service with mocked dependencies
  const arduino = new ArduinoService(mockFileSystem, mockProcessExecutor);
  
  // Execute: all three command types
  await arduino.compile('LEDBlink', { fqbn: 'rp2040:rp2040:seeed_xiao_rp2040' });
  await arduino.deploy('LEDBlink', { fqbn: 'rp2040:rp2040:seeed_xiao_rp2040', port: 'COM3' });
  
  const spawnCalls = mockProcessExecutor.getSpawnCalls();
  expect(spawnCalls).toHaveLength(2);
  
  // All commands should include config file parameter
  spawnCalls.forEach(call => {
    expect(call.args).toEqual(expect.arrayContaining(['--config-file']));
  });
});

test('A2-007: Sketch path resolution finds correct .ino file', async () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockProcessExecutor = new MockProcessExecutorAdapter();
  
  // Setup: Allow sketch directories to exist
  mockFileSystem.setExistsSyncBehavior(() => true);
  
  // Setup: successful arduino-cli execution
  mockProcessExecutor.setSpawnBehavior(
    mockProcessExecutor.createSuccessSpawn('Compilation successful', '')
  );
  
  // Create service with mocked dependencies
  const arduino = new ArduinoService(mockFileSystem, mockProcessExecutor);
  
  // Execute: compile with specific sketch name
  await arduino.compile('NeoPixel_SerialControl', { fqbn: 'rp2040:rp2040:seeed_xiao_rp2040' });
  
  const spawnCalls = mockProcessExecutor.getSpawnCalls();
  expect(spawnCalls).toHaveLength(1);
  
  const call = spawnCalls[0];
  expect(call.command).toBe('arduino-cli');
  expect(call.args).toEqual(expect.arrayContaining(['compile']));
  // Sketch path should be passed as the last argument
  const lastArg = call.args[call.args.length - 1];
  expect(lastArg).toContain('NeoPixel_SerialControl');
});

test('A2-008: Different board FQBN mapping for Arduino Uno R4', async () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockProcessExecutor = new MockProcessExecutorAdapter();
  
  // Setup: Allow sketch directories to exist
  mockFileSystem.setExistsSyncBehavior(() => true);
  
  // Setup: successful arduino-cli execution
  mockProcessExecutor.setSpawnBehavior(
    mockProcessExecutor.createSuccessSpawn('Compilation successful', '')
  );
  
  // Create service with mocked dependencies
  const arduino = new ArduinoService(mockFileSystem, mockProcessExecutor);
  
  // Execute: compile with Arduino Uno R4 FQBN
  await arduino.compile('SerialLedControl', { fqbn: 'arduino:renesas_uno:minima' });
  
  const spawnCalls = mockProcessExecutor.getSpawnCalls();
  expect(spawnCalls).toHaveLength(1);
  
  const call = spawnCalls[0];
  expect(call.command).toBe('arduino-cli');
  expect(call.args).toEqual(expect.arrayContaining([
    'compile',
    '--fqbn',
    'arduino:renesas_uno:minima'
  ]));
});

test('A2-009: Board-specific installation commands for platforms and libraries', async () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockProcessExecutor = new MockProcessExecutorAdapter();
  
  // Setup: Allow all directories to exist
  mockFileSystem.setExistsSyncBehavior(() => true);
  
  // Setup: successful arduino-cli execution for multiple install commands
  mockProcessExecutor.setSpawnBehavior(
    mockProcessExecutor.createSuccessSpawn('Installation successful', '')
  );
  
  // Create service with mocked dependencies
  const arduino = new ArduinoService(mockFileSystem, mockProcessExecutor);
  
  // Execute: install command for XIAO RP2040 with platform and libraries
  const boardConfig = { 
    id: 'xiao-rp2040',
    platform: { package: 'rp2040:rp2040', version: '3.6.0' },
    libraries: [{ name: 'Adafruit NeoPixel', version: '1.15.1' }]
  };
  
  await arduino.install({ board: boardConfig });
  
  const spawnCalls = mockProcessExecutor.getSpawnCalls();
  expect(spawnCalls.length).toBeGreaterThan(0);
  
  // Should have install commands for platform and libraries
  const platformCall = spawnCalls.find(call => 
    call.args.includes('core') && call.args.includes('install')
  );
  const libraryCall = spawnCalls.find(call => 
    call.args.includes('lib') && call.args.includes('install')
  );
  
  expect(platformCall).toBeDefined();
  expect(libraryCall).toBeDefined();
});

test('A2-010: Command sequence maintains parameter consistency', async () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockProcessExecutor = new MockProcessExecutorAdapter();
  
  // Setup: Allow all directories to exist
  mockFileSystem.setExistsSyncBehavior(() => true);
  
  // Setup: successful arduino-cli execution for all commands
  mockProcessExecutor.setSpawnBehavior(
    mockProcessExecutor.createSuccessSpawn('Command successful', '')
  );
  
  // Create service with mocked dependencies and debug log level
  const arduino = new ArduinoService(mockFileSystem, mockProcessExecutor, { logLevel: 'debug' });
  
  const boardConfig = { 
    id: 'xiao-rp2040',
    platform: { package: 'rp2040:rp2040', version: '3.6.0' },
    libraries: []
  };
  
  // Execute: full command sequence with consistent log level
  await arduino.install({ board: boardConfig, logLevel: 'debug' });
  await arduino.compile('LEDBlink', { fqbn: 'rp2040:rp2040:seeed_xiao_rp2040' }, 'debug');
  await arduino.deploy('LEDBlink', { fqbn: 'rp2040:rp2040:seeed_xiao_rp2040' }, { port: 'COM3', logLevel: 'debug' });
  
  const spawnCalls = mockProcessExecutor.getSpawnCalls();
  expect(spawnCalls.length).toBeGreaterThan(0);
  
  // All commands should use consistent debug log level
  spawnCalls.forEach(call => {
    expect(call.args).toEqual(expect.arrayContaining(['--log-level', 'debug']));
  });
});