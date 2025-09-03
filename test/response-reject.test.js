/**
 * @fileoverview REJECT Response Tests
 * 
 * Tests parsing and display of REJECT responses from microcontrollers.
 * Covers error scenarios and their appropriate handling and display.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LedController } from '../src/controller.js';
import { captureConsoleOutput } from './__tests__/helpers/console-capture.js';
import { createMockLedController, setMockResponse, clearMockResponse } from './__tests__/helpers/controller-mock.js';

// Mock the entire controller module
vi.mock('../src/controller.js', async () => {
  const actual = await vi.importActual('../src/controller.js');
  return {
    ...actual,
    LedController: createMockLedController()
  };
});

describe('REJECT Response Handling', () => {
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

  it('should parse and display REJECT,COLOR,invalid format response', async () => {
    setMockResponse('REJECT,COLOR,invalid format');
    
    await controller.connect();
    await controller.sendCommand('COLOR,invalid');
    
    const logs = consoleCapture.getLogs();
    expect(logs).toContain('Device response: REJECT,COLOR,invalid format');
  });

  it('should parse REJECT,BLINK1,invalid parameters response', async () => {
    setMockResponse('REJECT,BLINK1,invalid parameters');
    
    await controller.connect();
    await controller.sendCommand('BLINK1,invalid');
    
    const logs = consoleCapture.getLogs();
    expect(logs).toContain('Device response: REJECT,BLINK1,invalid parameters');
  });

  it('should parse REJECT,UNKNOWN,unknown command response', async () => {
    setMockResponse('REJECT,UNKNOWN,unknown command');
    
    await controller.connect();
    await controller.sendCommand('UNKNOWN');
    
    const logs = consoleCapture.getLogs();
    expect(logs).toContain('Device response: REJECT,UNKNOWN,unknown command');
  });

  it('should handle REJECT with detailed error message', async () => {
    const errorMsg = 'Command failed: Invalid parameter count. Expected 3, got 1. Usage: COLOR,r,g,b';
    setMockResponse(`REJECT,COLOR,${errorMsg}`);
    
    await controller.connect();
    await controller.sendCommand('COLOR,invalid');
    
    const logs = consoleCapture.getLogs();
    expect(logs).toContain(`Device response: REJECT,COLOR,${errorMsg}`);
  });
});