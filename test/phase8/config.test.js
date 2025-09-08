/**
 * @fileoverview Phase 8: Configuration Management Tests with Dependency Injection
 * 
 * Tests verify the configuration loading system using Clean Architecture principles.
 * Uses interface-based mocks instead of module mocks for better isolation.
 * 
 * Following Test-Matrix.md guidelines:
 * - Flat test structure (no describe blocks)
 * - Stateless mock design for predictable behavior
 * - Self-contained tests with PX-XXX naming
 */

import { test, expect } from 'vitest';
import { ConfigService, setConfigService, resetConfigService } from '../../src/utils/config.js';
import { MockFileSystemAdapter } from '../adapters/mock-file-system.adapter.js';
import { MockConfigAdapter } from '../adapters/mock-config.adapter.js';

test('C1-001: Default config values when .env file is not present', () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockConfig = new MockConfigAdapter();
  
  // Setup: no .env file exists
  mockFileSystem.setExistsSyncBehavior(() => false);
  
  // Create service with mocked dependencies
  const configService = new ConfigService(mockFileSystem, mockConfig);
  
  const result = configService.loadConfig();
  
  expect(result).toEqual({
    serialPort: null,
    arduinoConfigFile: './arduino-cli.yaml',
    fqbn: 'rp2040:rp2040:seeed_xiao_rp2040'
  });
});

test('C1-002: Environment variables override defaults (SERIAL_PORT)', () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockConfig = new MockConfigAdapter();
  
  // Setup: env variable is set
  mockConfig.setEnv('SERIAL_PORT', 'COM42');
  
  // Create service with mocked dependencies
  const configService = new ConfigService(mockFileSystem, mockConfig);
  
  const result = configService.loadConfig();
  expect(result.serialPort).toBe('COM42');
});

test('C1-003: Search for .env file in multiple locations', () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockConfig = new MockConfigAdapter();
  
  let existsSyncCalls = [];
  mockFileSystem.setExistsSyncBehavior((path) => {
    existsSyncCalls.push(path);
    return false; // No .env file found
  });
  
  // Create service with mocked dependencies
  const configService = new ConfigService(mockFileSystem, mockConfig);
  
  configService.loadConfig();
  
  // Should have searched for .env file
  expect(existsSyncCalls.length).toBeGreaterThan(0);
  expect(existsSyncCalls.some(path => path.includes('.env'))).toBe(true);
});

test('C1-004: Custom .env file path parameter', () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockConfig = new MockConfigAdapter();
  
  const customPath = './custom/.env';
  let loadDotenvCalls = [];
  
  // Setup: custom path exists
  mockFileSystem.setExistsSyncBehavior((path) => path === customPath);
  mockConfig.setLoadDotenvBehavior((options) => {
    loadDotenvCalls.push(options);
  });
  
  // Create service with mocked dependencies
  const configService = new ConfigService(mockFileSystem, mockConfig);
  
  configService.loadConfig(customPath);
  
  expect(loadDotenvCalls).toHaveLength(1);
  expect(loadDotenvCalls[0].path).toBe(customPath);
});

test('C1-005: Load environment variables from .env file via dotenv', () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockConfig = new MockConfigAdapter();
  
  // Setup: .env file exists and dotenv sets SERIAL_PORT
  mockFileSystem.setExistsSyncBehavior(() => true);
  mockConfig.setLoadDotenvBehavior(() => {
    mockConfig.setEnv('SERIAL_PORT', 'COM7');
  });
  
  // Create service with mocked dependencies
  const configService = new ConfigService(mockFileSystem, mockConfig);
  
  const result = configService.loadConfig();
  
  expect(result.serialPort).toBe('COM7');
});

test('C1-006: Existing environment variables preferred over .env file', () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockConfig = new MockConfigAdapter();
  
  // Setup: env var already set before loading .env
  mockConfig.setEnv('SERIAL_PORT', 'COM8');
  mockFileSystem.setExistsSyncBehavior(() => true);
  mockConfig.setLoadDotenvBehavior(() => {
    // dotenv would normally not override existing env vars
    // This mimics dotenv's actual behavior
  });
  
  // Create service with mocked dependencies
  const configService = new ConfigService(mockFileSystem, mockConfig);
  
  const result = configService.loadConfig();
  
  expect(result.serialPort).toBe('COM8');
});

test('C1-007: Command-line argument has highest priority', () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockConfig = new MockConfigAdapter();
  
  // Create service with mocked dependencies
  const configService = new ConfigService(mockFileSystem, mockConfig);
  
  const port = configService.getSerialPort('COM5');
  expect(port).toBe('COM5');
});

test('C1-008: Fall back to SERIAL_PORT env when no CLI argument', () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockConfig = new MockConfigAdapter();
  
  // Setup: env variable is set
  mockConfig.setEnv('SERIAL_PORT', 'COM_ENV');
  
  // Create service with mocked dependencies
  const configService = new ConfigService(mockFileSystem, mockConfig);
  
  const port = configService.getSerialPort();
  expect(port).toBe('COM_ENV');
});

test('C1-009: Descriptive error when no serial port in any source', () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockConfig = new MockConfigAdapter();
  
  // Setup: no .env file and no env variables
  mockFileSystem.setExistsSyncBehavior(() => false);
  
  // Create service with mocked dependencies
  const configService = new ConfigService(mockFileSystem, mockConfig);
  
  expect(() => configService.getSerialPort()).toThrow('Serial port not specified');
});

test('C1-010: Custom .env path passed to loadConfig', () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockConfig = new MockConfigAdapter();
  
  const customEnvPath = '/custom/.env';
  let loadDotenvOptions = null;
  
  // Setup: custom path exists and returns port
  mockFileSystem.setExistsSyncBehavior((path) => path === customEnvPath);
  mockConfig.setLoadDotenvBehavior((options) => {
    loadDotenvOptions = options;
    mockConfig.setEnv('SERIAL_PORT', 'COM9');
  });
  
  // Create service with mocked dependencies
  const configService = new ConfigService(mockFileSystem, mockConfig);
  
  const port = configService.getSerialPort(null, customEnvPath);
  
  expect(port).toBe('COM9');
  expect(loadDotenvOptions.path).toBe(customEnvPath);
});

test('C1-011: Full priority chain - CLI > env var > .env file', () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockConfig = new MockConfigAdapter();
  
  // Setup: .env file would set COM10
  mockFileSystem.setExistsSyncBehavior(() => true);
  mockConfig.setLoadDotenvBehavior(() => {
    // Only set if not already set (mimics dotenv behavior)
    if (!mockConfig.getEnv('SERIAL_PORT')) {
      mockConfig.setEnv('SERIAL_PORT', 'COM10');
    }
  });
  
  // Create service with mocked dependencies
  const configService = new ConfigService(mockFileSystem, mockConfig);
  
  // Test 1: CLI argument takes highest priority
  expect(configService.getSerialPort('COM_CLI')).toBe('COM_CLI');
  
  // Test 2: Environment variable takes priority over .env
  mockConfig.clearEnv();
  mockConfig.setEnv('SERIAL_PORT', 'COM_ENV');
  expect(configService.getSerialPort()).toBe('COM_ENV');
  
  // Test 3: .env file value used when no CLI arg or env var
  mockConfig.clearEnv();
  expect(configService.getSerialPort()).toBe('COM10');
});