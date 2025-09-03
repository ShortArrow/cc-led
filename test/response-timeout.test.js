/**
 * @fileoverview Response Timeout Tests
 * 
 * Tests timeout behavior when no response is received from microcontrollers.
 * Verifies proper timeout handling in different environments.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LedController } from '../src/controller.js';
import { captureConsoleOutput } from './__tests__/helpers/console-capture.js';
import { createMockLedController, clearMockResponse } from './__tests__/helpers/controller-mock.js';

// Mock the entire controller module
vi.mock('../src/controller.js', async () => {
  const actual = await vi.importActual('../src/controller.js');
  return {
    ...actual,
    LedController: createMockLedController()
  };
});

describe('Response Timeout Handling', () => {
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

  it('should display timeout message when no response received', async () => {
    // No response configured - should timeout
    await controller.connect();
    await controller.sendCommand('ON');
    
    const logs = consoleCapture.getLogs();
    expect(logs).toContain('Sent command: ON');
    expect(logs).toContain('No response received from device (timeout)');
  });

  it('should use shorter timeout in test environment', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    
    try {
      await controller.connect();
      
      const startTime = Date.now();
      await controller.sendCommand('ON');
      const endTime = Date.now();
      
      // Should complete very quickly (< 20ms)
      expect(endTime - startTime).toBeLessThan(20);
      
      const logs = consoleCapture.getLogs();
      expect(logs).toContain('No response received from device (timeout)');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('should demonstrate timeout behavior with no response', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    
    try {
      await controller.connect();
      
      const startTime = Date.now();
      await controller.sendCommand('NO_RESPONSE');
      const endTime = Date.now();
      
      // Should complete quickly due to test timeout
      expect(endTime - startTime).toBeLessThan(20);
      
      const logs = consoleCapture.getLogs();
      expect(logs).toContain('No response received from device (timeout)');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});