import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
 * Load environment variables from .env file if available
 * @param {string} [envPath] - Optional custom path to .env file
 * @returns {void}
 */
function loadDotenvFile(envPath) {
  // Only try runtime locations, avoid package-relative paths
  const possiblePaths = [
    envPath,
    join(process.cwd(), DEFAULT_CONFIG.ENV_FILE_NAME),  // Current working directory
    // Removed package-relative paths to prevent bundling .env files
  ].filter(Boolean);
  
  // Try to load .env file from available paths
  for (const configPath of possiblePaths) {
    if (existsSync(configPath)) {
      dotenvConfig({ path: configPath });
      break;
    }
  }
}

/**
 * Load application configuration
 * @param {string} [envPath] - Optional path to .env file
 * @returns {Object} Configuration object with serialPort, arduinoConfigFile, and fqbn
 */
export function loadConfig(envPath) {
  // Load environment variables from .env file
  loadDotenvFile(envPath);
  
  return {
    serialPort: process.env[ENV_VAR_NAMES.SERIAL_PORT] || null,
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
export function getSerialPort(cmdPort, envPath) {
  // Priority 1: Command line argument
  if (cmdPort) {
    return cmdPort;
  }
  
  // Priority 2: Environment variables (including .env file)
  const config = loadConfig(envPath);
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