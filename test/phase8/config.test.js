/**
 * @fileoverview Phase 8: Configuration Management Tests
 * 
 * Tests verify the configuration loading system that manages
 * Arduino CLI settings and serial port selection. Configuration can
 * come from .env files, environment variables, or command-line arguments.
 * 
 * Following Test-Matrix.md guidelines:
 * - Flat test structure (no describe blocks)
 * - Clear mocks for each test
 * - Self-contained tests with PX-XXX naming
 */

import { test, expect, vi } from 'vitest';
import { loadConfig, getSerialPort } from '../../src/utils/config.js';
import { existsSync } from 'fs';

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn()
}));

// Mock dotenv
vi.mock('dotenv', () => ({
  config: vi.fn()
}));

test('C1-001: Default config values when .env file is not present', () => {
  // Clear mocks and env
  vi.clearAllMocks();
  delete process.env.SERIAL_PORT;
  
  vi.mocked(existsSync).mockReturnValue(false);
  
  const config = loadConfig();
  
  expect(config).toEqual({
    serialPort: null,
    arduinoConfigFile: './arduino-cli.yaml',
    fqbn: 'rp2040:rp2040:seeed_xiao_rp2040'
  });
});

test('C1-002: Environment variables override defaults (SERIAL_PORT)', () => {
  // Clear mocks and setup env
  vi.clearAllMocks();
  delete process.env.SERIAL_PORT;
  
  vi.mocked(existsSync).mockReturnValue(true);
  process.env.SERIAL_PORT = 'COM3';
  
  const config = loadConfig();
  
  expect(config.serialPort).toBe('COM3');
  
  // Cleanup
  delete process.env.SERIAL_PORT;
});

test('C1-003: Search for .env file in multiple locations', () => {
  // Clear mocks and env
  vi.clearAllMocks();
  delete process.env.SERIAL_PORT;
  
  vi.mocked(existsSync).mockImplementation((path) => {
    // Simulate .env file exists in project root only
    return path.includes('..') && path.endsWith('.env');
  });
  
  const config = loadConfig();
  
  // Should successfully load config even when .env is in different location
  expect(config).toEqual({
    serialPort: null,
    arduinoConfigFile: './arduino-cli.yaml',
    fqbn: 'rp2040:rp2040:seeed_xiao_rp2040'
  });
  
  // Should have searched available paths
  expect(vi.mocked(existsSync)).toHaveBeenCalledTimes(1);
});

test('C1-004: Custom .env file path parameter', async () => {
  // Clear mocks
  vi.clearAllMocks();
  delete process.env.SERIAL_PORT;
  
  const customPath = '/custom/path/.env';
  vi.mocked(existsSync).mockImplementation((path) => path === customPath);
  
  const { config } = await import('dotenv');
  loadConfig(customPath);
  
  expect(vi.mocked(config)).toHaveBeenCalledWith({ path: customPath });
});

test('C1-005: Load environment variables from .env file via dotenv', async () => {
  // Clear mocks and env
  vi.clearAllMocks();
  delete process.env.SERIAL_PORT;
  
  // Reset and re-import modules to ensure clean state
  vi.resetModules();
  
  // Re-import after module reset
  const { existsSync } = await import('fs');
  const { config } = await import('dotenv');
  const { loadConfig } = await import('../../src/utils/config.js');
  
  vi.mocked(existsSync).mockImplementation(() => true);
  vi.mocked(config).mockImplementation(() => {
    process.env.SERIAL_PORT = 'COM7';
  });
  
  const result = loadConfig();
  
  expect(result.serialPort).toBe('COM7');
  expect(vi.mocked(config)).toHaveBeenCalled();
  
  // Cleanup
  delete process.env.SERIAL_PORT;
});

test('C1-006: Existing environment variables preferred over .env file', async () => {
  // Clear mocks and setup
  vi.clearAllMocks();
  delete process.env.SERIAL_PORT;
  
  vi.mocked(existsSync).mockImplementation(() => true);
  
  // Set env var before loading config
  process.env.SERIAL_PORT = 'COM8';
  
  // Mock dotenv trying to set different value
  const { config } = await import('dotenv');
  vi.mocked(config).mockImplementation(() => {
    // dotenv would normally not override existing env vars
    // This mimics dotenv's actual behavior
  });
  
  const result = loadConfig();
  
  expect(result.serialPort).toBe('COM8');
  
  // Cleanup
  delete process.env.SERIAL_PORT;
});

test('C1-007: Command-line argument has highest priority', () => {
  // Clear mocks
  vi.clearAllMocks();
  
  const port = getSerialPort('COM5');
  expect(port).toBe('COM5');
});

test('C1-008: Fall back to SERIAL_PORT env when no CLI argument', () => {
  // Clear mocks and setup
  vi.clearAllMocks();
  
  process.env.SERIAL_PORT = 'COM4';
  const port = getSerialPort();
  expect(port).toBe('COM4');
  
  // Cleanup
  delete process.env.SERIAL_PORT;
});

test('C1-009: Descriptive error when no serial port in any source', () => {
  // Clear mocks and env
  vi.clearAllMocks();
  delete process.env.SERIAL_PORT;
  
  vi.mocked(existsSync).mockReturnValue(false);
  expect(() => getSerialPort()).toThrow('Serial port not specified');
});

test('C1-010: Custom .env path passed to loadConfig', async () => {
  // Clear mocks and env
  vi.clearAllMocks();
  delete process.env.SERIAL_PORT;
  
  const customEnvPath = '/custom/.env';
  vi.mocked(existsSync).mockImplementation((path) => path === customEnvPath);
  
  const { config } = await import('dotenv');
  vi.mocked(config).mockImplementation(() => {
    process.env.SERIAL_PORT = 'COM9';
  });
  
  const port = getSerialPort(null, customEnvPath);
  
  expect(port).toBe('COM9');
  expect(vi.mocked(config)).toHaveBeenCalledWith({ path: customEnvPath });
  
  // Cleanup
  delete process.env.SERIAL_PORT;
});

test('C1-011: Full priority chain - CLI > env var > .env file', async () => {
  // Clear mocks and env
  vi.clearAllMocks();
  delete process.env.SERIAL_PORT;
  
  // Setup: .env file would set COM10
  vi.mocked(existsSync).mockReturnValue(true);
  const { config } = await import('dotenv');
  vi.mocked(config).mockImplementation(() => {
    // This would be in .env file
    process.env.SERIAL_PORT = process.env.SERIAL_PORT || 'COM10';
  });
  
  // Test 1: CLI argument takes highest priority
  expect(getSerialPort('COM_CLI')).toBe('COM_CLI');
  
  // Test 2: Environment variable takes priority over .env
  process.env.SERIAL_PORT = 'COM_ENV';
  expect(getSerialPort()).toBe('COM_ENV');
  
  // Test 3: .env file value used when no CLI arg or env var
  delete process.env.SERIAL_PORT;
  vi.mocked(config).mockImplementation(() => {
    process.env.SERIAL_PORT = 'COM10';
  });
  expect(getSerialPort()).toBe('COM10');
  
  // Cleanup
  delete process.env.SERIAL_PORT;
});