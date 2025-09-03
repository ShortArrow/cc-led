/**
 * @fileoverview Mock utilities for LedController testing
 * 
 * Provides mock implementations and factories for testing LedController
 * functionality without actual hardware dependencies.
 */

import { vi } from 'vitest';

/**
 * Creates a mock LedController for testing response parsing
 * @returns {Function} Mock constructor function
 */
export const createMockLedController = () => {
  return vi.fn().mockImplementation(function(port, options = {}) {
    this.portName = port;
    this.baudRate = options.baudRate || 9600;
    this.serialPort = null;
    this.board = options.board;
    this.protocol = this.board ? this.board.getLedProtocol() : 'WS2812';
    
    // Mock connect method
    this.connect = vi.fn().mockResolvedValue();
    
    // Mock sendCommand with configurable response
    this.sendCommand = vi.fn().mockImplementation((command) => {
      console.log(`Sent command: ${command}`);
      
      // Simulate different responses based on global test state
      const mockResponse = global.testMockResponse;
      if (mockResponse) {
        console.log(`Device response: ${mockResponse}`);
      } else {
        console.log('No response received from device (timeout)');
      }
      return Promise.resolve();
    });
    
    // Include original parseColor method
    this.parseColor = (color) => {
      const COLORS = {
        red: '255,0,0',
        green: '0,255,0',
        blue: '0,0,255',
        yellow: '255,255,0',
        purple: '255,0,255',
        cyan: '0,255,255',
        white: '255,255,255'
      };
      
      const lowerColor = color.toLowerCase();
      if (COLORS[lowerColor]) {
        return COLORS[lowerColor];
      }
      
      if (/^\d{1,3},\d{1,3},\d{1,3}$/.test(color)) {
        const [r, g, b] = color.split(',').map(Number);
        const inRange = (n) => Number.isInteger(n) && n >= 0 && n <= 255;
        if (inRange(r) && inRange(g) && inRange(b)) {
          return `${r},${g},${b}`;
        }
        throw new Error(`Invalid color: ${color}. RGB values must be between 0 and 255`);
      }
      
      throw new Error(`Invalid color: ${color}. Use a color name (red, green, blue, etc.) or RGB format (255,0,0)`);
    };
    
    // Mock methods that use sendCommand
    this.turnOn = () => this.sendCommand('ON');
    this.turnOff = () => this.sendCommand('OFF');
    this.setColor = (color) => {
      const rgb = this.parseColor(color);
      return this.sendCommand(`COLOR,${rgb}`);
    };
    this.blink = (color, interval = 500) => {
      const rgb = this.parseColor(color);
      return this.sendCommand(`BLINK1,${rgb},${interval}`);
    };
    this.blink2Colors = (color1, color2, interval = 500) => {
      const rgb1 = this.parseColor(color1);
      const rgb2 = this.parseColor(color2);
      return this.sendCommand(`BLINK2,${rgb1},${rgb2},${interval}`);
    };
    this.rainbow = (interval = 50) => {
      return this.sendCommand(`RAINBOW,${interval}`);
    };
  });
};

/**
 * Creates a mock SerialPort for CLI command testing
 * @returns {Function} Mock SerialPort constructor
 */
export const createMockSerialPort = () => {
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

  return vi.fn().mockImplementation(function(options, callback) {
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
  });
};

/**
 * Sets up mock response for controller tests
 * @param {string} response - The response to mock
 */
export const setMockResponse = (response) => {
  global.testMockResponse = response;
};

/**
 * Clears mock response for controller tests
 */
export const clearMockResponse = () => {
  global.testMockResponse = undefined;
};