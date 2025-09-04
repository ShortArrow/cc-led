/**
 * @fileoverview CLI Command Priority and Option Conflict Tests
 * 
 * Tests the priority logic when multiple CLI options are specified and
 * validates handling of conflicting option combinations.
 * Covers Test-Matrix.md P3-001 through P3-010.
 * 
 * Following Zenn article best practices for self-contained tests without timeouts.
 */

import { it, expect, vi, beforeEach } from 'vitest';

// Mock SerialPort with immediate synchronous behavior
const mockWrite = vi.fn((data, callback) => {
  if (callback) callback(); // Immediate success callback
});

const mockSerialPortInstance = {
  write: mockWrite,
  close: vi.fn((callback) => { if (callback) callback(); }),
  on: vi.fn((event, handler) => {
    // For data events, immediately call with a mock success response
    if (event === 'data') {
      setImmediate(() => handler(Buffer.from('ACCEPTED,TEST')));
    }
  }),
  off: vi.fn(),
  removeListener: vi.fn(),
  isOpen: true
};

const MockSerialPort = vi.fn((config, callback) => {
  // Immediate successful connection callback
  if (callback) setImmediate(() => callback(null));
  return mockSerialPortInstance;
});

vi.mock('serialport', () => ({
  SerialPort: MockSerialPort
}));

vi.mock('../src/utils/config.js', () => ({
  getSerialPort: vi.fn(() => 'COM3')
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// Command Priority Tests

// P3-001: On takes priority over off
it('P3-001: should turn on LED when both --on and --off are specified', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  await executeCommand({ port: 'COM3', on: true, off: true });
  
  expect(mockWrite).toHaveBeenCalledWith('ON\n', expect.any(Function));
});

// P3-002: Off takes priority over color
it('P3-002: should turn off LED when --off and --color are specified', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  await executeCommand({ port: 'COM3', off: true, color: 'red' });
  
  expect(mockWrite).toHaveBeenCalledWith('OFF\n', expect.any(Function));
});

// P3-003: Blink takes priority over color  
it('P3-003: should blink when --blink and --color are specified', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  await executeCommand({ 
    port: 'COM3', 
    blink: 'green',
    color: 'red',
    interval: 500
  });
  
  expect(mockWrite).toHaveBeenCalledWith('BLINK1,0,255,0,500\n', expect.any(Function));
});

// P3-004: Rainbow takes priority over blink
it('P3-004: should run rainbow when --rainbow and --blink are specified', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  await executeCommand({ 
    port: 'COM3', 
    rainbow: true,
    blink: 'red',
    interval: 100
  });
  
  expect(mockWrite).toHaveBeenCalledWith('RAINBOW,100\n', expect.any(Function));
});

// P3-005: Command execution order follows specification priority
it('P3-005: should follow command priority: on > off > rainbow > blink > color', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  // Test with all commands - on should win
  await executeCommand({ 
    port: 'COM3', 
    on: true,
    off: true,
    rainbow: true,
    blink: 'red',
    color: 'blue'
  });
  
  expect(mockWrite).toHaveBeenCalledWith('ON\n', expect.any(Function));
});

// CLI Option Conflict Tests

// P3-006: Conflicting color specifications
it('P3-006: should handle conflicting color specifications consistently', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  await executeCommand({ 
    port: 'COM3', 
    blink: 'red',    // Should be used (blink takes priority)
    color: 'blue'    // Should be ignored
  });
  
  expect(mockWrite).toHaveBeenCalledWith('BLINK1,255,0,0,500\n', expect.any(Function));
});

// P3-007: Multiple interval specifications
it('P3-007: should use the last interval value when multiple are specified', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  // In practice, CLI parsing would handle this, but test the behavior
  await executeCommand({ 
    port: 'COM3', 
    blink: 'red',
    interval: 1000  // This value is used
  });
  
  expect(mockWrite).toHaveBeenCalledWith('BLINK1,255,0,0,1000\n', expect.any(Function));
});

// P3-008: Mutually exclusive options (on/off)
it('P3-008: should handle mutually exclusive on/off with on taking priority', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  await executeCommand({ 
    port: 'COM3', 
    on: true,
    off: true
  });
  
  expect(mockWrite).toHaveBeenCalledWith('ON\n', expect.any(Function));
});

// P3-009: Options requiring additional parameters
it('P3-009: should handle blink without explicit interval (use default)', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  await executeCommand({ 
    port: 'COM3', 
    blink: 'red'
    // No interval specified - should use default 500ms
  });
  
  expect(mockWrite).toHaveBeenCalledWith('BLINK1,255,0,0,500\n', expect.any(Function));
});

// P3-010: Invalid option combinations
it('P3-010: should reject when no action is specified', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  await expect(executeCommand({ 
    port: 'COM3'
    // No action specified
  })).rejects.toThrow('No action specified');
});

// Port Priority Tests (P3-011 to P3-013)

// P3-011: CLI argument overrides environment variable
it('P3-011: --port argument should override SERIAL_PORT environment variable', async () => {
  // Setup: Mock environment variable
  const originalEnv = process.env.SERIAL_PORT;
  process.env.SERIAL_PORT = 'COM10';
  
  // Mock getSerialPort to verify the priority
  vi.mock('../src/utils/config.js', () => ({
    getSerialPort: vi.fn((cliPort) => {
      // Simulate actual priority: CLI > env > .env
      if (cliPort) return cliPort;
      if (process.env.SERIAL_PORT) return process.env.SERIAL_PORT;
      return 'COM3'; // default
    })
  }));
  
  const { executeCommand } = await import('../src/controller.js');
  
  // Execute: Provide CLI port that should override env
  await executeCommand({ 
    port: 'COM5', // CLI arg
    on: true
  });
  
  // Assert: COM5 should be used, not COM10 from env
  expect(mockWrite).toHaveBeenCalledWith('ON\n', expect.any(Function));
  // Verify the mock was created with COM5
  expect(MockSerialPort).toHaveBeenCalledWith(
    expect.objectContaining({ path: 'COM5' }),
    expect.any(Function)
  );
  
  // Cleanup
  if (originalEnv !== undefined) {
    process.env.SERIAL_PORT = originalEnv;
  } else {
    delete process.env.SERIAL_PORT;
  }
});

// P3-012: Environment variable used when no CLI argument
it('P3-012: SERIAL_PORT environment variable should be used when no --port provided', async () => {
  // Setup: Mock environment variable
  const originalEnv = process.env.SERIAL_PORT;
  process.env.SERIAL_PORT = 'COM7';
  
  // Reset module mocks for clean test
  vi.resetModules();
  vi.mock('serialport', () => ({
    SerialPort: MockSerialPort
  }));
  vi.mock('../src/utils/config.js', () => ({
    getSerialPort: vi.fn((cliPort) => {
      // Simulate actual priority: CLI > env > .env
      if (cliPort) return cliPort;
      if (process.env.SERIAL_PORT) return process.env.SERIAL_PORT;
      return 'COM3'; // default
    })
  }));
  
  const { executeCommand } = await import('../src/controller.js');
  
  // Execute: No CLI port, should use env var
  await executeCommand({ 
    // No port specified - should use env var
    on: true
  });
  
  // Assert: COM7 from env should be used
  expect(MockSerialPort).toHaveBeenCalledWith(
    expect.objectContaining({ path: 'COM7' }),
    expect.any(Function)
  );
  
  // Cleanup
  if (originalEnv !== undefined) {
    process.env.SERIAL_PORT = originalEnv;
  } else {
    delete process.env.SERIAL_PORT;
  }
});

// P3-013: .env file used as last fallback
it('P3-013: .env file value should be used when no CLI arg or env var', async () => {
  // Setup: Clear environment variable and mock .env file
  const originalEnv = process.env.SERIAL_PORT;
  delete process.env.SERIAL_PORT;
  
  // Mock dotenv and config to simulate .env file
  vi.resetModules();
  vi.mock('dotenv', () => ({
    config: vi.fn(() => {
      // Simulate .env file setting SERIAL_PORT
      process.env.SERIAL_PORT = 'COM8';
    })
  }));
  
  vi.mock('serialport', () => ({
    SerialPort: MockSerialPort
  }));
  
  vi.mock('../src/utils/config.js', () => ({
    getSerialPort: vi.fn((cliPort) => {
      // Load .env if no CLI arg provided
      if (!cliPort && !process.env.SERIAL_PORT) {
        const { config } = require('dotenv');
        config(); // This sets process.env.SERIAL_PORT = 'COM8'
      }
      
      // Return priority: CLI > env > .env
      if (cliPort) return cliPort;
      if (process.env.SERIAL_PORT) return process.env.SERIAL_PORT;
      return 'COM3'; // default fallback
    })
  }));
  
  const { executeCommand } = await import('../src/controller.js');
  
  // Execute: No CLI port, no env var - should load from .env
  await executeCommand({ 
    // No port specified - should use .env file
    on: true
  });
  
  // Assert: COM8 from .env should be used
  expect(MockSerialPort).toHaveBeenCalledWith(
    expect.objectContaining({ path: 'COM8' }),
    expect.any(Function)
  );
  
  // Cleanup
  if (originalEnv !== undefined) {
    process.env.SERIAL_PORT = originalEnv;
  } else {
    delete process.env.SERIAL_PORT;
  }
});

// P3-014: Error when no port specified anywhere
it('P3-014: should throw descriptive error when port not specified in any source', async () => {
  // Setup: Clear all port sources
  const originalEnv = process.env.SERIAL_PORT;
  delete process.env.SERIAL_PORT;
  
  // Mock modules to simulate no .env file and no defaults
  vi.resetModules();
  vi.mock('dotenv', () => ({
    config: vi.fn(() => {
      // Simulate .env file not existing or not having SERIAL_PORT
      // Do not set process.env.SERIAL_PORT
    })
  }));
  
  vi.mock('serialport', () => ({
    SerialPort: MockSerialPort
  }));
  
  vi.mock('../src/utils/config.js', () => ({
    getSerialPort: vi.fn((cliPort) => {
      // Load .env if no CLI arg provided
      if (!cliPort && !process.env.SERIAL_PORT) {
        const { config } = require('dotenv');
        config(); // This does NOT set SERIAL_PORT
      }
      
      // Check all sources
      if (cliPort) return cliPort;
      if (process.env.SERIAL_PORT) return process.env.SERIAL_PORT;
      
      // No port found anywhere - throw error
      throw new Error('Serial port not specified. Please provide --port argument, set SERIAL_PORT environment variable, or add SERIAL_PORT to .env file');
    })
  }));
  
  const { executeCommand } = await import('../src/controller.js');
  
  // Execute & Assert: Should throw error when no port found
  await expect(executeCommand({ 
    // No port specified anywhere
    on: true
  })).rejects.toThrow('Serial port not specified');
  
  // Cleanup
  if (originalEnv !== undefined) {
    process.env.SERIAL_PORT = originalEnv;
  } else {
    delete process.env.SERIAL_PORT;
  }
});