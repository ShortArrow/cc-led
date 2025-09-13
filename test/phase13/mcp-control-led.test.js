import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ControlLedUseCase } from '../../src/application/mcp/use-cases/control-led.use-case.js';

/**
 * Phase 13: MCP Integration Tests - Control LED Functionality
 * Test ID: M1-011 to M1-015
 * 
 * Validates MCP controlLed method integration with hardware control
 */
describe('M1-011 to M1-015: MCP Control LED Integration', () => {
  let useCase;
  let mockLedController;
  let mockLedMapping;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockLedController = {
      controlLed: vi.fn(),
      getLedStatus: vi.fn()
    };
    mockLedMapping = {
      getPortForLed: vi.fn(),
      getAllMappings: vi.fn()
    };
    useCase = new ControlLedUseCase(mockLedController, mockLedMapping);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('M1-011: should turn on LED successfully', async () => {
    mockLedMapping.getPortForLed.mockResolvedValue('/dev/ttyUSB0');
    mockLedController.controlLed.mockResolvedValue({ success: true });

    const result = await useCase.execute({
      ledNumber: 1,
      action: 'on',
      color: '#FF0000',
      brightness: 80
    });

    expect(result.success).toBe(true);
    expect(mockLedMapping.getPortForLed).toHaveBeenCalledWith(1);
    expect(mockLedController.controlLed).toHaveBeenCalledWith(
      1, 'on', { color: '#FF0000', brightness: 80 }
    );
  });

  it('M1-012: should turn off LED successfully', async () => {
    mockLedMapping.getPortForLed.mockResolvedValue('/dev/ttyUSB0');
    mockLedController.controlLed.mockResolvedValue({ success: true });

    const result = await useCase.execute({
      ledNumber: 2,
      action: 'off'
    });

    expect(result.success).toBe(true);
    expect(mockLedMapping.getPortForLed).toHaveBeenCalledWith(2);
    expect(mockLedController.controlLed).toHaveBeenCalledWith(
      2, 'off', {}
    );
  });

  it('M1-013: should handle blink action with interval', async () => {
    mockLedMapping.getPortForLed.mockResolvedValue('/dev/ttyUSB0');
    mockLedController.controlLed.mockResolvedValue({ success: true });

    const result = await useCase.execute({
      ledNumber: 1,
      action: 'blink',
      color: '#00FF00',
      interval: 1000
    });

    expect(result.success).toBe(true);
    expect(mockLedController.controlLed).toHaveBeenCalledWith(
      1, 'blink', { color: '#00FF00', interval: 1000 }
    );
  });

  it('M1-014: should handle rainbow action', async () => {
    mockLedMapping.getPortForLed.mockResolvedValue('/dev/ttyUSB0');
    mockLedController.controlLed.mockResolvedValue({ success: true });

    const result = await useCase.execute({
      ledNumber: 1,
      action: 'rainbow',
      interval: 50
    });

    expect(result.success).toBe(true);
    expect(mockLedController.controlLed).toHaveBeenCalledWith(
      1, 'rainbow', { interval: 50 }
    );
  });

  it('M1-015: should handle LED mapping errors', async () => {
    mockLedMapping.getPortForLed.mockResolvedValue(null); // Return null for unmapped LED

    await expect(useCase.execute({
      ledNumber: 5,
      action: 'on'
    })).rejects.toThrow('LED 5 is not configured');

    // Verify error handling by checking the exception was thrown correctly
    expect(mockLedMapping.getPortForLed).toHaveBeenCalledWith(5);
  });

  it('M1-016: should handle two-color blink action', async () => {
    mockLedMapping.getPortForLed.mockResolvedValue('/dev/ttyUSB0');
    mockLedController.controlLed.mockResolvedValue({ success: true });

    const result = await useCase.execute({
      ledNumber: 1,
      action: 'blink',
      color: '#FF0000',
      secondColor: '#0000FF',
      interval: 1000
    });

    expect(result.success).toBe(true);
    expect(mockLedController.controlLed).toHaveBeenCalledWith(
      1, 'blink', { color: '#FF0000', secondColor: '#0000FF', interval: 1000 }
    );
  });
});