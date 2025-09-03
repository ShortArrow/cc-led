/**
 * @fileoverview Basic CLI Command Tests (ON/OFF/COLOR)
 * 
 * Tests the basic control commands and their mapping to serial commands.
 * This file focuses on the core functionality: turning LEDs on/off and setting colors.
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

describe('CLI Basic Commands', () => {
  const mockSerialPort = async () => {
    const { SerialPort } = vi.mocked(await import('serialport'));
    return SerialPort.mock.results[SerialPort.mock.results.length - 1].value;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ON/OFF Commands', () => {
    it('--on flag should generate ON command', async () => {
      await executeCommand({ port: 'COM3', on: true });
      
      const serialPort = await mockSerialPort();
      expect(serialPort.write).toHaveBeenCalledWith('ON\n', expect.any(Function));
    });

    it('--off flag should generate OFF command', async () => {
      await executeCommand({ port: 'COM3', off: true });
      
      const serialPort = await mockSerialPort();
      expect(serialPort.write).toHaveBeenCalledWith('OFF\n', expect.any(Function));
    });
  });

  describe('Color Commands', () => {
    it('--color red should generate COLOR,255,0,0 command', async () => {
      await executeCommand({ port: 'COM3', color: 'red' });
      
      const serialPort = await mockSerialPort();
      expect(serialPort.write).toHaveBeenCalledWith('COLOR,255,0,0\n', expect.any(Function));
    });

    it('--color blue should generate COLOR,0,0,255 command', async () => {
      await executeCommand({ port: 'COM3', color: 'blue' });
      
      const serialPort = await mockSerialPort();
      expect(serialPort.write).toHaveBeenCalledWith('COLOR,0,0,255\n', expect.any(Function));
    });

    it('--color "100,150,200" should generate COLOR,100,150,200 command', async () => {
      await executeCommand({ port: 'COM3', color: '100,150,200' });
      
      const serialPort = await mockSerialPort();
      expect(serialPort.write).toHaveBeenCalledWith('COLOR,100,150,200\n', expect.any(Function));
    });
  });
});