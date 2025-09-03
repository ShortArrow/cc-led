/**
 * @fileoverview CLI Boundary Value Tests
 * 
 * Tests boundary values and edge cases for CLI inputs including
 * RGB color boundaries, interval boundaries, and complex option combinations.
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

describe('CLI Boundary Values', () => {
  const mockSerialPort = async () => {
    const { SerialPort } = vi.mocked(await import('serialport'));
    return SerialPort.mock.results[SerialPort.mock.results.length - 1].value;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RGB Color Boundaries', () => {
    it('should accept RGB minimum values (0,0,0)', async () => {
      await executeCommand({ port: 'COM3', color: '0,0,0' });
      
      const serialPort = await mockSerialPort();
      expect(serialPort.write).toHaveBeenCalledWith('COLOR,0,0,0\n', expect.any(Function));
    });

    it('should accept RGB maximum values (255,255,255)', async () => {
      await executeCommand({ port: 'COM3', color: '255,255,255' });
      
      const serialPort = await mockSerialPort();
      expect(serialPort.write).toHaveBeenCalledWith('COLOR,255,255,255\n', expect.any(Function));
    });

    it('should reject RGB values above maximum (256,0,0)', async () => {
      await expect(executeCommand({ port: 'COM3', color: '256,0,0' }))
        .rejects.toThrow('Invalid color');
    });

    it('should reject negative RGB values (-1,0,0)', async () => {
      await expect(executeCommand({ port: 'COM3', color: '-1,0,0' }))
        .rejects.toThrow('Invalid color');
    });

    it('should reject non-integer RGB values (1.5,0,0)', async () => {
      await expect(executeCommand({ port: 'COM3', color: '1.5,0,0' }))
        .rejects.toThrow('Invalid color');
    });
  });

  describe('Interval Value Boundaries', () => {
    it('should accept minimum interval value 1', async () => {
      await executeCommand({ port: 'COM3', blink: 'red', interval: 1 });
      
      const serialPort = await mockSerialPort();
      expect(serialPort.write).toHaveBeenCalledWith('BLINK1,255,0,0,1\n', expect.any(Function));
    });

    it('should accept large interval values', async () => {
      await executeCommand({ port: 'COM3', blink: 'red', interval: 10000 });
      
      const serialPort = await mockSerialPort();
      expect(serialPort.write).toHaveBeenCalledWith('BLINK1,255,0,0,10000\n', expect.any(Function));
    });

    it('should handle zero interval', async () => {
      await executeCommand({ port: 'COM3', blink: 'red', interval: 0 });
      
      const serialPort = await mockSerialPort();
      expect(serialPort.write).toHaveBeenCalledWith('BLINK1,255,0,0,0\n', expect.any(Function));
    });
  });

  describe('Color Format Edge Cases', () => {
    it('should handle color names with different cases', async () => {
      await executeCommand({ port: 'COM3', color: 'RED' });
      
      const serialPort = await mockSerialPort();
      expect(serialPort.write).toHaveBeenCalledWith('COLOR,255,0,0\n', expect.any(Function));
    });

    it('should handle RGB with extra spaces', async () => {
      await expect(executeCommand({ port: 'COM3', color: ' 100 , 150 , 200 ' }))
        .rejects.toThrow('Invalid color');
    });

    it('should reject RGB with too few components', async () => {
      await expect(executeCommand({ port: 'COM3', color: '100,150' }))
        .rejects.toThrow('Invalid color');
    });

    it('should reject RGB with too many components', async () => {
      await expect(executeCommand({ port: 'COM3', color: '100,150,200,50' }))
        .rejects.toThrow('Invalid color');
    });

    it('should reject empty color string', async () => {
      await expect(executeCommand({ port: 'COM3', color: '' }))
        .rejects.toThrow('Invalid color');
    });
  });

  describe('Complex Option Combinations', () => {
    it('should handle rainbow with invalid interval type', async () => {
      await executeCommand({ port: 'COM3', rainbow: true, interval: 'fast' });
      
      const serialPort = await mockSerialPort();
      // Should use NaN or default behavior
      expect(serialPort.write).toHaveBeenCalledWith('RAINBOW,NaN\n', expect.any(Function));
    });
  });
});