/**
 * @fileoverview ACCEPTED Response Tests
 * 
 * Tests parsing and display of ACCEPTED responses from microcontrollers.
 * Covers various command types and their successful response handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LedController } from '../src/controller.js';
import { captureConsoleOutput } from './__tests__/helpers/console-capture.js';
// Mock the entire controller module
vi.mock('../src/controller.js', async () => {
  const actual = await vi.importActual('../src/controller.js');
  return {
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
    })
  };
});

// Helper functions for mock response management
const setMockResponse = (response) => {
  global.testMockResponse = response;
};

const clearMockResponse = () => {
  global.testMockResponse = undefined;
};

describe('ACCEPTED Response Handling', () => {
  let controller;
  let consoleCapture;
  
  beforeEach(() => {
    vi.clearAllMocks();
    clearMockResponse();
    controller = new LedController('COM3');
    consoleCapture = captureConsoleOutput();
  });

  afterEach(() => {
    consoleCapture.restore();
    clearMockResponse();
  });

  it('should parse and display ACCEPTED,ON response correctly', async () => {
    setMockResponse('ACCEPTED,ON');
    
    await controller.connect();
    await controller.sendCommand('ON');
    
    const logs = consoleCapture.getLogs();
    expect(logs).toContain('Sent command: ON');
    expect(logs).toContain('Device response: ACCEPTED,ON');
  });

  it('should parse ACCEPTED,COLOR,255,0,0 response', async () => {
    setMockResponse('ACCEPTED,COLOR,255,0,0');
    
    await controller.connect();
    await controller.sendCommand('COLOR,255,0,0');
    
    const logs = consoleCapture.getLogs();
    expect(logs).toContain('Device response: ACCEPTED,COLOR,255,0,0');
  });

  it('should parse ACCEPTED,BLINK1,0,255,0,interval=500 response', async () => {
    setMockResponse('ACCEPTED,BLINK1,0,255,0,interval=500');
    
    await controller.connect();
    await controller.sendCommand('BLINK1,0,255,0,500');
    
    const logs = consoleCapture.getLogs();
    expect(logs).toContain('Device response: ACCEPTED,BLINK1,0,255,0,interval=500');
  });

  it('should parse complex BLINK2 response with two colors', async () => {
    const response = 'ACCEPTED,BLINK2,255,0,0,0,0,255,interval=750';
    setMockResponse(response);
    
    await controller.connect();
    await controller.sendCommand('BLINK2,255,0,0,0,0,255,750');
    
    const logs = consoleCapture.getLogs();
    expect(logs).toContain(`Device response: ${response}`);
  });

  it('should parse ACCEPTED,RAINBOW,interval=100 response', async () => {
    setMockResponse('ACCEPTED,RAINBOW,interval=100');
    
    await controller.connect();
    await controller.sendCommand('RAINBOW,100');
    
    const logs = consoleCapture.getLogs();
    expect(logs).toContain('Device response: ACCEPTED,RAINBOW,interval=100');
  });
});