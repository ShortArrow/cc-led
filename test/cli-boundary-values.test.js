/**
 * @fileoverview CLI Boundary Value Tests
 * 
 * Tests boundary values and edge cases for CLI inputs including
 * RGB color boundaries, interval boundaries, and complex option combinations.
 * 
 * Based on working pattern from cli-basic-commands.test.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCommand } from '../src/controller.js';

// Mock serialport
vi.mock('serialport', () => {
  const mockWrite = vi.fn((data, callback) => {
    if (callback) callback();
  });
  
  const mockOn = vi.fn((event, handler) => {
    // Simulate immediate device response
    if (event === 'data') {
      setImmediate(() => {
        handler(Buffer.from('ACCEPTED,TEST\n'));
      });
    }
  });

  return {
    SerialPort: vi.fn().mockImplementation(function(options, callback) {
      this.path = options.path;
      this.baudRate = options.baudRate;
      this.isOpen = true;
      this.write = mockWrite;
      this.on = mockOn;
      this.off = vi.fn();
      this.close = vi.fn((cb) => {
        this.isOpen = false;
        if (cb) cb();
      });
      
      if (callback) {
        setImmediate(() => callback());
      }
    })
  };
});

// Mock config
vi.mock('../src/utils/config.js', () => ({
  getSerialPort: vi.fn(() => 'COM3')
}));

describe('CLI Boundary Values', () => {
  const mockSerialPort = async () => {
    const { SerialPort } = vi.mocked(await import('serialport'));
    return SerialPort.mock.results[SerialPort.mock.results.length - 1].value;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RGB Color Boundaries', () => {
    it('P2-001: should accept RGB minimum values (0,0,0)', async () => {
      await executeCommand({ port: 'COM3', color: '0,0,0' });
      
      const serialPort = await mockSerialPort();
      expect(serialPort.write).toHaveBeenCalledWith('COLOR,0,0,0\n', expect.any(Function));
    });

    it('P2-002: should accept RGB maximum values (255,255,255)', async () => {
      await executeCommand({ port: 'COM3', color: '255,255,255' });
      
      const serialPort = await mockSerialPort();
      expect(serialPort.write).toHaveBeenCalledWith('COLOR,255,255,255\n', expect.any(Function));
    });

    it('P2-003: should reject R channel above maximum (256,0,0)', async () => {
      await expect(executeCommand({ port: 'COM3', color: '256,0,0' }))
        .rejects.toThrow('Invalid color: 256,0,0. RGB values must be between 0 and 255');
    });

    it('P2-004: should reject G channel above maximum (0,256,0)', async () => {
      await expect(executeCommand({ port: 'COM3', color: '0,256,0' }))
        .rejects.toThrow('Invalid color: 0,256,0. RGB values must be between 0 and 255');
    });

    it('P2-005: should reject B channel above maximum (0,0,256)', async () => {
      await expect(executeCommand({ port: 'COM3', color: '0,0,256' }))
        .rejects.toThrow('Invalid color: 0,0,256. RGB values must be between 0 and 255');
    });

    it('P2-006: should reject R channel below minimum (-1,0,0)', async () => {
      await expect(executeCommand({ port: 'COM3', color: '-1,0,0' }))
        .rejects.toThrow('Invalid color: -1,0,0. RGB values must be between 0 and 255');
    });

    it('P2-007: should reject G channel below minimum (0,-1,0)', async () => {
      await expect(executeCommand({ port: 'COM3', color: '0,-1,0' }))
        .rejects.toThrow('Invalid color: 0,-1,0. RGB values must be between 0 and 255');
    });

    it('P2-008: should reject B channel below minimum (0,0,-1)', async () => {
      await expect(executeCommand({ port: 'COM3', color: '0,0,-1' }))
        .rejects.toThrow('Invalid color: 0,0,-1. RGB values must be between 0 and 255');
    });

    it('P2-009: should reject R channel non-integer (1.5,0,0)', async () => {
      await expect(executeCommand({ port: 'COM3', color: '1.5,0,0' }))
        .rejects.toThrow('Invalid color: 1.5,0,0. RGB values must be between 0 and 255');
    });

    it('P2-010: should reject G channel non-integer (0,1.5,0)', async () => {
      await expect(executeCommand({ port: 'COM3', color: '0,1.5,0' }))
        .rejects.toThrow('Invalid color: 0,1.5,0. RGB values must be between 0 and 255');
    });

    it('P2-011: should reject B channel non-integer (0,0,1.5)', async () => {
      await expect(executeCommand({ port: 'COM3', color: '0,0,1.5' }))
        .rejects.toThrow('Invalid color: 0,0,1.5. RGB values must be between 0 and 255');
    });

    it('P2-012: should accept minimum interval value (1ms)', async () => {
      await executeCommand({ port: 'COM3', blink: 'red', interval: 1 });
      
      const serialPort = await mockSerialPort();
      expect(serialPort.write).toHaveBeenCalledWith('BLINK1,255,0,0,1\n', expect.any(Function));
    });

    it('P2-013: should reject zero interval value', async () => {
      await expect(executeCommand({ port: 'COM3', blink: 'red', interval: 0 }))
        .rejects.toThrow('Invalid interval');
    });

    it('P2-014: should reject negative interval value', async () => {
      await expect(executeCommand({ port: 'COM3', blink: 'red', interval: -100 }))
        .rejects.toThrow('Invalid interval');
    });
  });
});