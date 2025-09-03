/**
 * @fileoverview Test Mock Setup Utilities
 * 
 * Provides reusable mock configurations for different types of tests.
 * These are factory functions to avoid Vitest hoisting issues.
 */

import { vi } from 'vitest';

/**
 * Creates SerialPort mock for CLI command tests
 */
export const createSerialPortMock = () => ({
  SerialPort: vi.fn().mockImplementation(function(options, callback) {
    this.path = options.path;
    this.baudRate = options.baudRate;
    this.isOpen = true;
    this.write = vi.fn((data, callback) => {
      if (callback) callback();
    });
    this.on = vi.fn((event, handler) => {
      // Simulate immediate device response
      if (event === 'data') {
        setImmediate(() => {
          handler(Buffer.from('ACCEPTED,TEST\n'));
        });
      }
    });
    this.off = vi.fn();
    this.close = vi.fn((cb) => {
      this.isOpen = false;
      if (cb) cb();
    });
    
    if (callback) {
      setImmediate(() => callback());
    }
  })
});

/**
 * Creates config mock
 */
export const createConfigMock = () => ({
  getSerialPort: vi.fn(() => 'COM3')
});

/**
 * Creates LedController mock for response parsing tests
 */
export const createLedControllerMock = (actual) => ({
  ...actual,
  LedController: vi.fn().mockImplementation(function(port, options = {}) {
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
    this.parseColor = actual.LedController.prototype.parseColor;
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
  })
});

/**
 * Helper functions for mock response management
 */
export const setMockResponse = (response) => {
  global.testMockResponse = response;
};

export const clearMockResponse = () => {
  global.testMockResponse = undefined;
};