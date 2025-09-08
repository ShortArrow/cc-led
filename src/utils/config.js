/**
 * @fileoverview Configuration Management with Dependency Injection
 * 
 * Provides configuration loading functionality following Clean Architecture principles.
 * Uses dependency injection for testable design without external dependencies.
 */

import { join } from 'path';
import { NodeFileSystemAdapter } from '../adapters/node-file-system.adapter.js';
import { NodeConfigAdapter } from '../adapters/node-config.adapter.js';

// Default configuration constants
const DEFAULT_CONFIG = {
  ARDUINO_CONFIG_FILE: './arduino-cli.yaml',
  FQBN: 'rp2040:rp2040:seeed_xiao_rp2040',
  ENV_FILE_NAME: '.env'
};

const ENV_VAR_NAMES = {
  SERIAL_PORT: 'SERIAL_PORT'
};

/**
 * Configuration Service with Dependency Injection
 */
export class ConfigService {
  /**
   * Create ConfigService with injected dependencies
   * @param {FileSystemInterface} fileSystem - File system adapter
   * @param {ConfigInterface} configAdapter - Configuration adapter
   */
  constructor(fileSystem, configAdapter) {
    this.fileSystem = fileSystem;
    this.configAdapter = configAdapter;
  }

  /**
   * Load environment variables from .env file if available
   * @param {string} [envPath] - Optional custom path to .env file
   * @returns {void}
   */
  loadDotenvFile(envPath) {
    // Only try runtime locations, avoid package-relative paths
    const possiblePaths = [
      envPath,
      join(process.cwd(), DEFAULT_CONFIG.ENV_FILE_NAME),  // Current working directory
      // Removed package-relative paths to prevent bundling .env files
    ].filter(Boolean);
    
    // Try to load .env file from available paths
    for (const configPath of possiblePaths) {
      if (this.fileSystem.existsSync(configPath)) {
        this.configAdapter.loadDotenv({ path: configPath });
        break;
      }
    }
  }

  /**
   * Load application configuration
   * @param {string} [envPath] - Optional path to .env file
   * @returns {Object} Configuration object with serialPort, arduinoConfigFile, and fqbn
   */
  loadConfig(envPath) {
    // Load environment variables from .env file
    this.loadDotenvFile(envPath);
    
    return {
      serialPort: this.configAdapter.getEnv(ENV_VAR_NAMES.SERIAL_PORT) || null,
      arduinoConfigFile: DEFAULT_CONFIG.ARDUINO_CONFIG_FILE,
      fqbn: DEFAULT_CONFIG.FQBN
    };
  }

  /**
   * Get serial port with priority: CLI argument > environment variable > .env file
   * @param {string} [cmdPort] - Port from command line argument (highest priority)
   * @param {string} [envPath] - Optional path to .env file
   * @returns {string} Serial port string
   * @throws {Error} When no serial port is specified in any source
   */
  getSerialPort(cmdPort, envPath) {
    // Priority 1: Command line argument
    if (cmdPort) {
      return cmdPort;
    }
    
    // Priority 2: Environment variables (including .env file)
    const config = this.loadConfig(envPath);
    if (config.serialPort) {
      return config.serialPort;
    }
    
    // No serial port found in any source
    throw new Error(
      `Serial port not specified. Please specify using one of these methods:\n` +
      `  1. Command line: --port <port> or -p <port>\n` +
      `  2. Environment variable: SERIAL_PORT=<port>\n` +
      `  3. .env file: SERIAL_PORT=<port>`
    );
  }
}

// Default singleton instance for production use
let defaultConfigService = null;

/**
 * Get default ConfigService instance with production adapters
 * @returns {ConfigService} Default configuration service
 */
function getDefaultConfigService() {
  if (!defaultConfigService) {
    defaultConfigService = new ConfigService(
      new NodeFileSystemAdapter(),
      new NodeConfigAdapter()
    );
  }
  return defaultConfigService;
}

/**
 * Load application configuration (legacy API)
 * @param {string} [envPath] - Optional path to .env file
 * @returns {Object} Configuration object with serialPort, arduinoConfigFile, and fqbn
 */
export function loadConfig(envPath) {
  return getDefaultConfigService().loadConfig(envPath);
}

/**
 * Get serial port with priority: CLI argument > environment variable > .env file (legacy API)
 * @param {string} [cmdPort] - Port from command line argument (highest priority)
 * @param {string} [envPath] - Optional path to .env file
 * @returns {string} Serial port string
 * @throws {Error} When no serial port is specified in any source
 */
export function getSerialPort(cmdPort, envPath) {
  return getDefaultConfigService().getSerialPort(cmdPort, envPath);
}

/**
 * Set custom ConfigService instance (for testing)
 * @param {ConfigService} configService - Custom configuration service
 */
export function setConfigService(configService) {
  defaultConfigService = configService;
}

/**
 * Reset to default ConfigService (for testing cleanup)
 */
export function resetConfigService() {
  defaultConfigService = null;
}