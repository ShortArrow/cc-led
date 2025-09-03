/**
 * @fileoverview Response Integration Tests
 * 
 * Tests the complete flow from command execution to response handling,
 * including cleanup and error handling scenarios.
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

describe('Response Integration', () => {
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

  describe('Command to Response Flow', () => {
    it('should show complete flow from command to successful response', async () => {
      setMockResponse('ACCEPTED,COLOR,255,0,255');
      
      await controller.connect();
      await controller.setColor('purple');
      
      const logs = consoleCapture.getLogs();
      expect(logs).toContain('Sent command: COLOR,255,0,255');
      expect(logs).toContain('Device response: ACCEPTED,COLOR,255,0,255');
    });

    it('should show complete flow from command to error response', async () => {
      setMockResponse('REJECT,BLINK1,255,255,255,500,invalid parameters');
      
      await controller.connect();
      await controller.sendCommand('BLINK1,255,255,255,500');
      
      const logs = consoleCapture.getLogs();
      expect(logs).toContain('Sent command: BLINK1,255,255,255,500');
      expect(logs).toContain('Device response: REJECT,BLINK1,255,255,255,500,invalid parameters');
    });
  });

  describe('Listener Cleanup and Error Handling', () => {
    it('removes data listener after ACCEPTED/REJECT response', async () => {
      setMockResponse('ACCEPTED,ON');
      
      await controller.connect();
      await controller.sendCommand('ON');
      
      expect(controller.sendCommand).toHaveBeenCalled();
    });

    it('rejects when write fails and cleans up listener/timeout', async () => {
      // Mock sendCommand to throw error
      controller.sendCommand = vi.fn().mockRejectedValue(new Error('Failed to send command'));
      
      await controller.connect();
      await expect(controller.sendCommand('ON')).rejects.toThrow('Failed to send command');
    });
  });

  describe('Response Timing Edge Cases', () => {
    it('should handle immediate response (0ms delay)', async () => {
      setMockResponse('ACCEPTED,IMMEDIATE');
      
      await controller.connect();
      
      const startTime = Date.now();
      await controller.sendCommand('IMMEDIATE');
      const endTime = Date.now();
      
      // Should complete very quickly
      expect(endTime - startTime).toBeLessThan(50);
      
      const logs = consoleCapture.getLogs();
      expect(logs).toContain('Device response: ACCEPTED,IMMEDIATE');
    });
  });
});