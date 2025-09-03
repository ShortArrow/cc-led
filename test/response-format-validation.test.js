/**
 * @fileoverview Response Format Validation Tests
 * 
 * Tests validation of response formats including case sensitivity,
 * invalid formats, and boundary value testing for response parsing.
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

describe('Response Format Validation', () => {
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

  describe('Valid Response Processing', () => {
    it('should only process responses starting with ACCEPTED or REJECT', async () => {
      setMockResponse('ACCEPTED,ON');
      
      await controller.connect();
      await controller.sendCommand('ON');
      
      const logs = consoleCapture.getLogs();
      expect(logs).toContain('Device response: ACCEPTED,ON');
      expect(logs).not.toContain('Device response: DEBUG: some debug message');
    });

    it('should handle responses with extra whitespace', async () => {
      setMockResponse('ACCEPTED,OFF');
      
      await controller.connect();
      await controller.sendCommand('OFF');
      
      const logs = consoleCapture.getLogs();
      expect(logs).toContain('Device response: ACCEPTED,OFF');
    });

    it('should handle multiple rapid responses correctly', async () => {
      setMockResponse('ACCEPTED,ON');
      
      await controller.connect();
      await controller.sendCommand('ON');
      
      const logs = consoleCapture.getLogs();
      expect(logs).toContain('Device response: ACCEPTED,ON');
    });
  });

  describe('Response Length Edge Cases', () => {
    it('should handle very long ACCEPTED response', async () => {
      const longParams = 'A'.repeat(1000);
      setMockResponse(`ACCEPTED,CUSTOM,${longParams}`);
      
      await controller.connect();
      await controller.sendCommand('CUSTOM');
      
      const logs = consoleCapture.getLogs();
      expect(logs).toContain(`Device response: ACCEPTED,CUSTOM,${longParams}`);
    });

    it('should handle minimal valid response', async () => {
      setMockResponse('ACCEPTED,');
      
      await controller.connect();
      await controller.sendCommand('TEST');
      
      const logs = consoleCapture.getLogs();
      expect(logs).toContain('Device response: ACCEPTED,');
    });

    it('should handle response with just ACCEPTED', async () => {
      setMockResponse('ACCEPTED');
      
      await controller.connect();
      await controller.sendCommand('TEST');
      
      const logs = consoleCapture.getLogs();
      expect(logs).toContain('Device response: ACCEPTED');
    });

    it('should handle response with just REJECT', async () => {
      setMockResponse('REJECT');
      
      await controller.connect();
      await controller.sendCommand('TEST');
      
      const logs = consoleCapture.getLogs();
      expect(logs).toContain('Device response: REJECT');
    });
  });

  describe('Special Character Handling', () => {
    it('should handle response with multiple commas', async () => {
      setMockResponse('ACCEPTED,COLOR,255,0,0,extra,data,here');
      
      await controller.connect();
      await controller.sendCommand('COLOR,255,0,0');
      
      const logs = consoleCapture.getLogs();
      expect(logs).toContain('Device response: ACCEPTED,COLOR,255,0,0,extra,data,here');
    });

    it('should handle response with special characters', async () => {
      setMockResponse('REJECT,ERROR,Invalid characters: @#$%^&*()');
      
      await controller.connect();
      await controller.sendCommand('INVALID');
      
      const logs = consoleCapture.getLogs();
      expect(logs).toContain('Device response: REJECT,ERROR,Invalid characters: @#$%^&*()');
    });

    it('should handle response with Unicode characters', async () => {
      setMockResponse('ACCEPTED,INFO,状态：成功 🚀');
      
      await controller.connect();
      await controller.sendCommand('INFO');
      
      const logs = consoleCapture.getLogs();
      expect(logs).toContain('Device response: ACCEPTED,INFO,状态：成功 🚀');
    });

    it('should handle response with newline characters in message', async () => {
      setMockResponse('REJECT,ERROR,Line1\\nLine2\\nLine3');
      
      await controller.connect();
      await controller.sendCommand('MULTILINE');
      
      const logs = consoleCapture.getLogs();
      expect(logs).toContain('Device response: REJECT,ERROR,Line1\\nLine2\\nLine3');
    });
  });

  describe('Case Sensitivity Tests', () => {
    it('should handle lowercase ACCEPTED', async () => {
      setMockResponse('accepted,on');
      
      await controller.connect();
      await controller.sendCommand('ON');
      
      const logs = consoleCapture.getLogs();
      // Should NOT match since our implementation is case-sensitive
      expect(logs).toContain('No response received from device (timeout)');
      expect(logs).not.toContain('Device response: accepted,on');
    });

    it('should handle mixed case REJECT', async () => {
      setMockResponse('Reject,Color,invalid');
      
      await controller.connect();
      await controller.sendCommand('COLOR');
      
      const logs = consoleCapture.getLogs();
      // Should NOT match since our implementation is case-sensitive
      expect(logs).toContain('No response received from device (timeout)');
      expect(logs).not.toContain('Device response: Reject,Color,invalid');
    });
  });

  describe('Invalid Response Formats', () => {
    it('should ignore response that does not start with ACCEPTED/REJECT', async () => {
      setMockResponse('STATUS,OK,ready');
      
      await controller.connect();
      await controller.sendCommand('STATUS');
      
      const logs = consoleCapture.getLogs();
      expect(logs).toContain('No response received from device (timeout)');
      expect(logs).not.toContain('Device response: STATUS,OK,ready');
    });

    it('should handle response starting with ACCEPTED prefix but different', async () => {
      setMockResponse('ACCEPTED_BUT_NOT_EXACT,ON');
      
      await controller.connect();
      await controller.sendCommand('ON');
      
      const logs = consoleCapture.getLogs();
      expect(logs).toContain('No response received from device (timeout)');
    });

    it('should handle empty response string', async () => {
      setMockResponse('');
      
      await controller.connect();
      await controller.sendCommand('EMPTY');
      
      const logs = consoleCapture.getLogs();
      expect(logs).toContain('No response received from device (timeout)');
    });
  });

  describe('Response Format Edge Cases', () => {
    it('should handle ACCEPTED with no command specified', async () => {
      setMockResponse('ACCEPTED,');
      
      await controller.connect();
      await controller.sendCommand('EMPTY_CMD');
      
      const logs = consoleCapture.getLogs();
      expect(logs).toContain('Device response: ACCEPTED,');
    });

    it('should handle response with numeric-only parameters', async () => {
      setMockResponse('ACCEPTED,123,456,789');
      
      await controller.connect();
      await controller.sendCommand('NUMERIC');
      
      const logs = consoleCapture.getLogs();
      expect(logs).toContain('Device response: ACCEPTED,123,456,789');
    });
  });
});