import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load configuration from .env file
 * @param {string} [envPath] - Optional path to .env file
 * @returns {Object} Configuration object
 */
export function loadConfig(envPath) {
  // Only try runtime locations, avoid package-relative paths
  const possiblePaths = [
    envPath,
    join(process.cwd(), '.env'),  // Current working directory
    // Removed package-relative paths to prevent bundling .env files
  ].filter(Boolean);
  
  for (const configPath of possiblePaths) {
    if (existsSync(configPath)) {
      dotenvConfig({ path: configPath });
      break;
    }
  }
  
  return {
    serialPort: process.env.SERIAL_PORT || null,
    arduinoConfigFile: './arduino-cli.yaml',
    fqbn: 'rp2040:rp2040:seeed_xiao_rp2040'
  };
}

/**
 * Get serial port from config or command line
 * @param {string} [cmdPort] - Port from command line
 * @param {string} [envPath] - Optional path to .env file
 * @returns {string} Serial port
 */
export function getSerialPort(cmdPort, envPath) {
  if (cmdPort) {
    return cmdPort;
  }
  
  const config = loadConfig(envPath);
  if (config.serialPort) {
    return config.serialPort;
  }
  
  throw new Error('Serial port not specified. Use -p option or set SERIAL_PORT in .env file');
}