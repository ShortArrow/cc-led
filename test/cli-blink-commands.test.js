/**
 * @fileoverview CLI Blink Command Tests
 * 
 * Tests blink commands including single-color and two-color blinking,
 * with various interval settings and color combinations.
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

describe('CLI Blink Commands', () => {
  const mockSerialPort = async () => {
    const { SerialPort } = vi.mocked(await import('serialport'));
    return SerialPort.mock.results[SerialPort.mock.results.length - 1].value;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Single Color Blink', () => {
    it('--blink should generate BLINK1,255,255,255,500 (default white, 500ms)', async () => {
      await executeCommand({ port: 'COM3', blink: true, interval: 500 });
      
      const serialPort = await mockSerialPort();
      expect(serialPort.write).toHaveBeenCalledWith('BLINK1,255,255,255,500\n', expect.any(Function));
    });

    it('--blink red --interval 1000 should generate BLINK1,255,0,0,1000', async () => {
      await executeCommand({ port: 'COM3', blink: 'red', interval: 1000 });
      
      const serialPort = await mockSerialPort();
      expect(serialPort.write).toHaveBeenCalledWith('BLINK1,255,0,0,1000\n', expect.any(Function));
    });

    it('--blink --color blue --interval 200 should prioritize blink color over color flag', async () => {
      await executeCommand({ 
        port: 'COM3', 
        blink: true, 
        color: 'blue',  // This becomes the blink color
        interval: 200 
      });
      
      const serialPort = await mockSerialPort();
      expect(serialPort.write).toHaveBeenCalledWith('BLINK1,0,0,255,200\n', expect.any(Function));
    });
  });

  describe('Two Color Blink', () => {
    it('--blink red --second-color blue --interval 750 should generate BLINK2 command', async () => {
      await executeCommand({ 
        port: 'COM3', 
        blink: 'red',
        secondColor: 'blue',
        interval: 750
      });
      
      const serialPort = await mockSerialPort();
      expect(serialPort.write).toHaveBeenCalledWith('BLINK2,255,0,0,0,0,255,750\n', expect.any(Function));
    });
  });
});