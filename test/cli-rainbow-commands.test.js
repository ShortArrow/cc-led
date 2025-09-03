/**
 * @fileoverview CLI Rainbow Command Tests
 * 
 * Tests rainbow effect commands with various interval settings.
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

describe('CLI Rainbow Commands', () => {
  const mockSerialPort = async () => {
    const { SerialPort } = vi.mocked(await import('serialport'));
    return SerialPort.mock.results[SerialPort.mock.results.length - 1].value;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('--rainbow should generate RAINBOW,500 (default interval)', async () => {
    await executeCommand({ port: 'COM3', rainbow: true, interval: 500 });
    
    const serialPort = await mockSerialPort();
    expect(serialPort.write).toHaveBeenCalledWith('RAINBOW,500\n', expect.any(Function));
  });

  it('--rainbow --interval 100 should generate RAINBOW,100', async () => {
    await executeCommand({ port: 'COM3', rainbow: true, interval: 100 });
    
    const serialPort = await mockSerialPort();
    expect(serialPort.write).toHaveBeenCalledWith('RAINBOW,100\n', expect.any(Function));
  });
});