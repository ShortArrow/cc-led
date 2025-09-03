/**
 * @fileoverview CLI Command Priority Tests
 * 
 * Tests the priority logic when multiple CLI options are specified.
 * Verifies that commands are executed in the correct order of precedence.
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

describe('CLI Command Priority Logic', () => {
  const mockSerialPort = async () => {
    const { SerialPort } = vi.mocked(await import('serialport'));
    return SerialPort.mock.results[SerialPort.mock.results.length - 1].value;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prioritize blink over color when both are specified', async () => {
    await executeCommand({ 
      port: 'COM3', 
      color: 'red',    // Should be ignored
      blink: 'green',  // Should be used
      interval: 300
    });
    
    const serialPort = await mockSerialPort();
    expect(serialPort.write).toHaveBeenCalledWith('BLINK1,0,255,0,300\n', expect.any(Function));
  });

  it('should prioritize on/off over other commands', async () => {
    await executeCommand({ 
      port: 'COM3', 
      on: true,        // Should be used
      color: 'red',    // Should be ignored
      blink: 'blue'    // Should be ignored
    });
    
    const serialPort = await mockSerialPort();
    expect(serialPort.write).toHaveBeenCalledWith('ON\n', expect.any(Function));
  });

  it('should prioritize --on when both --on and --off are provided', async () => {
    await executeCommand({ 
      port: 'COM3',
      on: true,
      off: true,
    });

    const serialPort = await mockSerialPort();
    expect(serialPort.write).toHaveBeenCalledWith('ON\n', expect.any(Function));
  });

  it('should handle blink with both blink color and color flag', async () => {
    await executeCommand({ 
      port: 'COM3', 
      blink: 'green',  // This should take priority
      color: 'red',    // This should be ignored
      interval: 300 
    });
    
    const serialPort = await mockSerialPort();
    expect(serialPort.write).toHaveBeenCalledWith('BLINK1,0,255,0,300\n', expect.any(Function));
  });

  it('should handle multiple conflicting flags (on + off + color)', async () => {
    await executeCommand({ 
      port: 'COM3', 
      on: true, 
      off: true, 
      color: 'red' 
    });
    
    const serialPort = await mockSerialPort();
    // Priority: on > off > color
    expect(serialPort.write).toHaveBeenCalledWith('ON\n', expect.any(Function));
  });
});