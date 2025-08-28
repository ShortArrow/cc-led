/**
 * @fileoverview LED Controller tests for Arduino board LED control
 * 
 * These tests verify the serial communication protocol for controlling
 * LEDs on Arduino boards including XIAO RP2040 NeoPixel (WS2812) and
 * Arduino Uno R4 builtin LED (Digital). The controller sends commands
 * via serial port to the Arduino sketch running on the board.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LedController } from '../src/controller.js';

// Mock serialport
vi.mock('serialport', () => ({
  SerialPort: vi.fn().mockImplementation(function(options, callback) {
    this.path = options.path;
    this.baudRate = options.baudRate;
    this.isOpen = true;
    
    this.write = vi.fn((data, cb) => {
      if (cb) cb();
    });
    
    this.close = vi.fn((cb) => {
      this.isOpen = false;
      if (cb) cb();
    });
    
    if (callback) {
      setImmediate(() => callback());
    }
  })
}));

// Mock config
vi.mock('../src/utils/config.js', () => ({
  getSerialPort: vi.fn(() => 'COM3')
}));

describe('LedController - Serial communication for XIAO RP2040 LED control', () => {
  let controller;

  beforeEach(() => {
    controller = new LedController('COM3');
    vi.clearAllMocks();
  });

  describe('Connection - Serial port lifecycle management', () => {
    it('should establish connection to specified COM port at 9600 baud rate', async () => {
      await controller.connect();
      expect(controller.serialPort).toBeDefined();
      expect(controller.serialPort.path).toBe('COM3');
      expect(controller.serialPort.baudRate).toBe(9600);
    });

    it('should properly close serial port connection when disconnecting', async () => {
      await controller.connect();
      await controller.disconnect();
      expect(controller.serialPort.isOpen).toBe(false);
    });
  });

  describe('Color parsing - Convert color inputs to RGB values (0-255)', () => {
    it('should convert predefined color names to RGB triplets', () => {
      expect(controller.parseColor('red')).toBe('255,0,0');
      expect(controller.parseColor('green')).toBe('0,255,0');
      expect(controller.parseColor('blue')).toBe('0,0,255');
      expect(controller.parseColor('yellow')).toBe('255,255,0');
      expect(controller.parseColor('purple')).toBe('255,0,255');
      expect(controller.parseColor('cyan')).toBe('0,255,255');
      expect(controller.parseColor('white')).toBe('255,255,255');
    });

    it('should accept and validate comma-separated RGB values (e.g., "100,150,200")', () => {
      expect(controller.parseColor('100,150,200')).toBe('100,150,200');
      expect(controller.parseColor('0,0,0')).toBe('0,0,0');
    });

    it('should handle color names case-insensitively (RED, red, Red all work)', () => {
      expect(controller.parseColor('RED')).toBe('255,0,0');
      expect(controller.parseColor('Green')).toBe('0,255,0');
    });

    it('should reject invalid color formats and out-of-range RGB values', () => {
      expect(() => controller.parseColor('invalid')).toThrow('Invalid color');
      expect(() => controller.parseColor('256,0,0,0')).toThrow('Invalid color');
    });
  });

  describe('Commands - Serial protocol implementation for LED control', () => {
    beforeEach(async () => {
      await controller.connect();
    });

    it('ON command: turns LED on with last used color', async () => {
      await controller.turnOn();
      expect(controller.serialPort.write).toHaveBeenCalledWith('ON\n', expect.any(Function));
    });

    it('OFF command: turns LED completely off', async () => {
      await controller.turnOff();
      expect(controller.serialPort.write).toHaveBeenCalledWith('OFF\n', expect.any(Function));
    });

    it('COLOR command: sets LED to static color (e.g., COLOR,255,0,0 for red)', async () => {
      await controller.setColor('red');
      expect(controller.serialPort.write).toHaveBeenCalledWith('COLOR,255,0,0\n', expect.any(Function));
    });

    it('BLINK1 command: blinks LED with single color at specified interval', async () => {
      await controller.blink('green', 300);
      expect(controller.serialPort.write).toHaveBeenCalledWith('BLINK1,0,255,0,300\n', expect.any(Function));
    });

    it('BLINK2 command: alternates between two colors at specified interval', async () => {
      await controller.blink2Colors('red', 'blue', 1000);
      expect(controller.serialPort.write).toHaveBeenCalledWith('BLINK2,255,0,0,0,0,255,1000\n', expect.any(Function));
    });

    it('RAINBOW command: cycles through color spectrum at specified speed', async () => {
      await controller.rainbow(100);
      expect(controller.serialPort.write).toHaveBeenCalledWith('RAINBOW,100\n', expect.any(Function));
    });

    it('should use 500ms as default blink interval when not specified', async () => {
      await controller.blink('red');
      expect(controller.serialPort.write).toHaveBeenCalledWith('BLINK1,255,0,0,500\n', expect.any(Function));
    });

    it('should use 50ms as default rainbow transition speed when not specified', async () => {
      await controller.rainbow();
      expect(controller.serialPort.write).toHaveBeenCalledWith('RAINBOW,50\n', expect.any(Function));
    });
  });

  describe('Error handling - Validate preconditions and handle failures', () => {
    it('should prevent command execution when serial port is not connected', async () => {
      await expect(controller.turnOn()).rejects.toThrow('Serial port is not open');
    });
  });
});

describe('LedController - Digital LED Protocol (Arduino Uno R4 builtin LED)', () => {
  let controller;
  let mockBoard;

  beforeEach(() => {
    mockBoard = {
      getLedProtocol: vi.fn(() => 'Digital'),
      config: {
        serial: { baudRate: 9600 }
      }
    };
    controller = new LedController('COM3', { board: mockBoard });
    // Don't clear mockBoard.getLedProtocol calls since we want to test constructor behavior
  });

  describe('Protocol detection - Digital LED support', () => {
    it('should detect Digital protocol from board configuration', () => {
      expect(controller.protocol).toBe('Digital');
      expect(mockBoard.getLedProtocol).toHaveBeenCalledTimes(1);
    });
  });

  describe('Digital LED Commands - Same command interface as RGB LEDs', () => {
    beforeEach(async () => {
      // Clear only serial port mocks, not board mocks
      if (controller.serialPort && controller.serialPort.write) {
        controller.serialPort.write.mockClear();
      }
      await controller.connect();
    });

    it('should support standard ON command', async () => {
      await controller.turnOn();
      expect(controller.serialPort.write).toHaveBeenCalledWith('ON\n', expect.any(Function));
    });

    it('should support standard OFF command', async () => {
      await controller.turnOff();
      expect(controller.serialPort.write).toHaveBeenCalledWith('OFF\n', expect.any(Function));
    });

    it('should accept color commands but ignore colors (turn on LED)', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      await controller.setColor('red');
      expect(controller.serialPort.write).toHaveBeenCalledWith('ON\n', expect.any(Function));
      expect(consoleSpy).toHaveBeenCalledWith("Note: Digital LED does not support colors. Color 'red' ignored, turning LED on.");
      
      await controller.setColor('blue'); 
      expect(controller.serialPort.write).toHaveBeenCalledWith('ON\n', expect.any(Function));
      expect(consoleSpy).toHaveBeenCalledWith("Note: Digital LED does not support colors. Color 'blue' ignored, turning LED on.");
      
      consoleSpy.mockRestore();
    });

    it('should accept blink commands with colors but ignore colors', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      await controller.blink('red', 1000);
      expect(controller.serialPort.write).toHaveBeenCalledWith('BLINK\n', expect.any(Function));
      expect(consoleSpy).toHaveBeenCalledWith("Note: Digital LED does not support colors. Color 'red' ignored, blinking LED.");
      
      consoleSpy.mockRestore();
    });

    it('should accept two-color blink but fall back to single-color blink', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      await controller.blink2Colors('red', 'blue', 500);
      expect(controller.serialPort.write).toHaveBeenCalledWith('BLINK\n', expect.any(Function));
      expect(consoleSpy).toHaveBeenCalledWith("Note: Digital LED does not support multi-color blinking. Colors 'red' and 'blue' ignored, using single-color blink.");
      
      consoleSpy.mockRestore();
    });

    it('should accept rainbow command but fall back to blinking', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      await controller.rainbow(100);
      expect(controller.serialPort.write).toHaveBeenCalledWith('BLINK\n', expect.any(Function));
      expect(consoleSpy).toHaveBeenCalledWith('Note: Digital LED does not support rainbow effect. Using simple blink instead.');
      
      consoleSpy.mockRestore();
    });
  });
});