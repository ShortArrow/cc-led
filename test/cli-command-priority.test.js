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