/**
 * @fileoverview CLI Input Validation Tests
 * 
 * Tests error handling and validation for CLI inputs including
 * invalid colors, malformed RGB values, and missing parameters.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCommand } from '../src/controller.js';
import { createMockSerialPort } from './__tests__/helpers/controller-mock.js';

// Mock serialport
vi.mock('serialport', () => ({
  SerialPort: createMockSerialPort()
}));

// Mock config
vi.mock('../src/utils/config.js', () => ({
  getSerialPort: vi.fn(() => 'COM3')
}));

describe('CLI Input Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Cases', () => {
    it('should throw error when no action is specified', async () => {
      await expect(executeCommand({ port: 'COM3' }))
        .rejects.toThrow('No action specified');
    });

    it('should throw error for invalid color format', async () => {
      await expect(executeCommand({ port: 'COM3', color: 'invalid-color' }))
        .rejects.toThrow('Invalid color');
    });

    it('should throw error for invalid RGB values', async () => {
      await expect(executeCommand({ port: 'COM3', color: '300,0,0' }))
        .rejects.toThrow('Invalid color');
    });
  });

  describe('Port Value Validation', () => {
    it('should handle empty port', async () => {
      await expect(executeCommand({ port: '', on: true }))
        .rejects.toThrow();
    });

    it('should handle null/undefined port', async () => {
      await expect(executeCommand({ port: null, on: true }))
        .rejects.toThrow();
      
      await expect(executeCommand({ port: undefined, on: true }))
        .rejects.toThrow();
    });
  });
});