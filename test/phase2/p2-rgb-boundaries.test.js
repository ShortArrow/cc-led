/**
 * @fileoverview P2-001 to P2-011: RGB Color Boundary Tests - Test-Matrix.md Compliant
 * 
 * Self-contained tests following Test-Matrix.md guidelines.
 * Tests RGB color validation and boundary conditions
 */

import { test, expect, vi } from 'vitest';
import { executeCommand } from '../../src/controller.js';

// Mock SerialPort with hoisting-safe approach
const mockWrite = vi.fn((data, callback) => {
  if (callback) callback();
});

const mockSerialPortInstance = {
  write: mockWrite,
  close: vi.fn((callback) => { if (callback) callback(); }),
  on: vi.fn((event, handler) => {
    if (event === 'data') {
      setImmediate(() => handler(Buffer.from('ACCEPTED,TEST')));
    }
  }),
  off: vi.fn(),
  isOpen: true
};

vi.mock('serialport', () => ({
  SerialPort: vi.fn((config, callback) => {
    if (callback) setImmediate(() => callback(null));
    return mockSerialPortInstance;
  })
}));

vi.mock('../../src/utils/config.js', () => ({
  getSerialPort: vi.fn(() => 'COM3')
}));

// P2-001 and P2-002 moved to p2-boundaries-success.test.js to prevent mock interference

test('P2-003: should reject R channel above maximum (256,0,0)', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Execute & Assert: Invalid R channel should throw error
  await expect(executeCommand({ port: 'COM3', color: '256,0,0' }))
    .rejects.toThrow('Invalid color: 256,0,0. RGB values must be between 0 and 255');
});

test('P2-004: should reject G channel above maximum (0,256,0)', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Execute & Assert: Invalid G channel should throw error
  await expect(executeCommand({ port: 'COM3', color: '0,256,0' }))
    .rejects.toThrow('Invalid color: 0,256,0. RGB values must be between 0 and 255');
});

test('P2-005: should reject B channel above maximum (0,0,256)', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Execute & Assert: Invalid B channel should throw error
  await expect(executeCommand({ port: 'COM3', color: '0,0,256' }))
    .rejects.toThrow('Invalid color: 0,0,256. RGB values must be between 0 and 255');
});

test('P2-006: should reject negative R channel (-1,0,0)', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Execute & Assert: Negative R channel should throw error
  await expect(executeCommand({ port: 'COM3', color: '-1,0,0' }))
    .rejects.toThrow('Invalid color: -1,0,0. RGB values must be between 0 and 255');
});

test('P2-007: should reject negative G channel (0,-1,0)', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Execute & Assert: Negative G channel should throw error
  await expect(executeCommand({ port: 'COM3', color: '0,-1,0' }))
    .rejects.toThrow('Invalid color: 0,-1,0. RGB values must be between 0 and 255');
});

test('P2-008: should reject negative B channel (0,0,-1)', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Execute & Assert: Negative B channel should throw error
  await expect(executeCommand({ port: 'COM3', color: '0,0,-1' }))
    .rejects.toThrow('Invalid color: 0,0,-1. RGB values must be between 0 and 255');
});

test('P2-009: should reject non-numeric R channel (a,0,0)', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Execute & Assert: Non-numeric R channel should throw error
  await expect(executeCommand({ port: 'COM3', color: 'a,0,0' }))
    .rejects.toThrow('Invalid color: a,0,0. Use a color name');
});

test('P2-010: should reject incomplete color format (255,255)', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Execute & Assert: Incomplete color format should throw error
  await expect(executeCommand({ port: 'COM3', color: '255,255' }))
    .rejects.toThrow('Invalid color: 255,255. Use a color name');
});

test('P2-011: should reject extra color components (255,255,255,100)', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Execute & Assert: Extra color components should throw error
  await expect(executeCommand({ port: 'COM3', color: '255,255,255,100' }))
    .rejects.toThrow('Invalid color: 255,255,255,100. Use a color name');
});