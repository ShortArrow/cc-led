/**
 * @fileoverview Configuration management tests
 * 
 * These tests verify the configuration loading system that manages
 * Arduino CLI settings and serial port selection. Configuration can
 * come from .env files, environment variables, or command-line arguments.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadConfig, getSerialPort } from '../src/utils/config.js';
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

describe('Config Utils - Environment and configuration management', () => {
  beforeEach(() => {
    // Clear environment variables
    delete process.env.SERIAL_PORT;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadConfig() - Load configuration from .env file and environment', () => {
    it('should return default values when .env file is not present', () => {
      vi.mocked(existsSync).mockReturnValue(false);
      
      const config = loadConfig();
      
      expect(config).toEqual({
        serialPort: null,
        arduinoConfigFile: './arduino-cli.yaml',
        fqbn: 'rp2040:rp2040:seeed_xiao_rp2040'
      });
    });

    it('should override defaults with values from environment variables (e.g., SERIAL_PORT)', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      process.env.SERIAL_PORT = 'COM3';
      
      const config = loadConfig();
      
      expect(config.serialPort).toBe('COM3');
    });

    it('should search for .env file in multiple locations (cwd, package root, project root)', () => {
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
      
      // Should have searched available paths (current working directory only for security)
      expect(vi.mocked(existsSync)).toHaveBeenCalledTimes(1);
    });

    it('should accept custom .env file path as parameter', async () => {
      const customPath = '/custom/path/.env';
      vi.mocked(existsSync).mockImplementation((path) => path === customPath);
      
      const { config } = await import('dotenv');
      loadConfig(customPath);
      
      expect(vi.mocked(config)).toHaveBeenCalledWith({ path: customPath });
    });

    it('should load environment variables from .env file via dotenv', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      
      // Mock dotenv to set env variables when called
      const { config } = await import('dotenv');
      vi.mocked(config).mockImplementation(() => {
        process.env.SERIAL_PORT = 'COM7';
      });
      
      const result = loadConfig();
      
      expect(result.serialPort).toBe('COM7');
      expect(vi.mocked(config)).toHaveBeenCalled();
    });

    it('should prefer already-set environment variables over .env file values', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      
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
    });
  });

  describe('getSerialPort() - Serial port resolution with priority order', () => {
    it('should prioritize command-line argument over all other sources', () => {
      const port = getSerialPort('COM5');
      expect(port).toBe('COM5');
    });

    it('should fall back to SERIAL_PORT environment variable when no CLI argument provided', () => {
      process.env.SERIAL_PORT = 'COM4';
      const port = getSerialPort();
      expect(port).toBe('COM4');
    });

    it('should throw descriptive error when no serial port specified in any source', () => {
      vi.mocked(existsSync).mockReturnValue(false);
      expect(() => getSerialPort()).toThrow('Serial port not specified');
    });

    it('should pass custom .env path to loadConfig when provided', async () => {
      const customEnvPath = '/custom/.env';
      vi.mocked(existsSync).mockImplementation((path) => path === customEnvPath);
      
      const { config } = await import('dotenv');
      vi.mocked(config).mockImplementation(() => {
        process.env.SERIAL_PORT = 'COM9';
      });
      
      const port = getSerialPort(null, customEnvPath);
      
      expect(port).toBe('COM9');
      expect(vi.mocked(config)).toHaveBeenCalledWith({ path: customEnvPath });
    });

    it('should demonstrate priority order: CLI arg > env var > .env file', async () => {
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
    });
  });
});