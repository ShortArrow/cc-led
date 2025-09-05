/**
 * @fileoverview C1-001: Default Configuration Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: No .env file present uses default values
 */

import { test, expect, vi } from 'vitest';
import { loadConfig } from '../../src/utils/config.js';

// Mock fs.existsSync to return false (no .env file)
vi.mock('fs', () => ({
  existsSync: vi.fn(() => false)
}));

// Mock dotenv.config to not load anything
vi.mock('dotenv', () => ({
  config: vi.fn(() => ({ parsed: null }))
}));

test('C1-001: No .env file present should use default configuration values', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Setup: Clear environment
  const originalSerialPort = process.env.SERIAL_PORT;
  delete process.env.SERIAL_PORT;
  
  // Execute: Load configuration without .env file
  const config = loadConfig();
  
  // Assert: Default values are used
  expect(config).toEqual({
    serialPort: null, // No default serial port
    arduinoConfigFile: './arduino-cli.yaml',
    fqbn: 'rp2040:rp2040:seeed_xiao_rp2040'
  });
  
  // Restore
  if (originalSerialPort) process.env.SERIAL_PORT = originalSerialPort;
});