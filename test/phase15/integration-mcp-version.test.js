import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetVersionUseCase } from '../../src/application/mcp/use-cases/get-version.use-case.js';
import { LedControllerImpl } from '../../src/infrastructure/mcp/led-controller-impl.js';

// Mock the SerialPort to simulate Arduino responses
vi.mock('serialport', () => ({
  SerialPort: vi.fn().mockImplementation((config, callback) => {
    const mockPort = {
      isOpen: true,
      write: vi.fn((command, callback) => {
        setTimeout(() => {
          callback && callback(null);
          // Simulate Arduino VERSION response
          if (command.includes('VERSION')) {
            setTimeout(() => {
              mockPort.emit('data', Buffer.from('VERSION,1.0.0-g1234567,arduino-uno-r4,UniversalLedControl,2024-09-14\n'));
            }, 10);
          }
        }, 5);
      }),
      close: vi.fn((callback) => {
        mockPort.isOpen = false;
        callback && callback();
      }),
      on: vi.fn((event, handler) => {
        mockPort._handlers = mockPort._handlers || {};
        mockPort._handlers[event] = handler;
      }),
      off: vi.fn(),
      emit: vi.fn((event, data) => {
        const handler = mockPort._handlers?.[event];
        if (handler) {
          handler(data);
        }
      }),
      _handlers: {}
    };
    
    // Simulate successful connection
    setTimeout(() => callback && callback(null), 5);
    
    return mockPort;
  })
}));

// Mock config utilities
vi.mock('../../src/utils/config.js', () => ({
  getSerialPort: vi.fn(() => '/dev/ttyUSB0')
}));

describe('MCP Hardware Version Integration', () => {
  let useCase;
  let ledController;

  beforeEach(() => {
    ledController = new LedControllerImpl();
    useCase = new GetVersionUseCase(ledController);
  });

  it('should get server version information', async () => {
    const result = await useCase.execute({ target: 'server' });
    
    expect(result).toHaveProperty('name', 'cc-led-mcp-server');
    expect(result).toHaveProperty('version');
    expect(result).toHaveProperty('packageVersion');
  });

  it('should get hardware version through complete data flow', async () => {
    // Initialize LED controller with mock port
    await ledController.initializeLed(1, '/dev/ttyUSB0', 'Test LED');
    
    const result = await useCase.execute({ target: 'hardware' });
    
    expect(result).toHaveProperty('name', 'Arduino LED Controller');
    expect(result).toHaveProperty('version', '1.0.0-g1234567');
    expect(result).toHaveProperty('board', 'arduino-uno-r4');
    expect(result).toHaveProperty('firmware', 'UniversalLedControl');
    expect(result).toHaveProperty('buildDate', '2024-09-14');
  });

  it('should handle hardware version timeout gracefully', async () => {
    const timeoutLedController = new LedControllerImpl();
    const timeoutUseCase = new GetVersionUseCase(timeoutLedController);
    
    // Spy on getHardwareVersion and force it to throw an error
    const getHardwareVersionSpy = vi.spyOn(timeoutLedController, 'getHardwareVersion')
      .mockRejectedValue(new Error('Unable to get hardware version from any configured LED'));

    await timeoutLedController.initializeLed(1, '/dev/ttyUSB0', 'Test LED');
    
    const result = await timeoutUseCase.execute({ target: 'hardware' });
    
    expect(result).toHaveProperty('name', 'Arduino LED Controller');
    expect(result).toHaveProperty('version', 'unknown');
    expect(result).toHaveProperty('error');
    
    getHardwareVersionSpy.mockRestore();
  });

  it('should handle no configured LEDs', async () => {
    const result = await useCase.execute({ target: 'hardware' });
    
    expect(result).toHaveProperty('name', 'Arduino LED Controller');
    expect(result).toHaveProperty('version', 'unknown');
    expect(result).toHaveProperty('error');
  });

  it('should validate data flow from MCP request to Arduino VERSION command', async () => {
    // This test verifies the complete data flow:
    // MCP Request → GetVersionUseCase → LedControllerImpl.getHardwareVersion() → 
    // LedController.getVersion() → Arduino VERSION command → Response parsing

    await ledController.initializeLed(1, '/dev/ttyUSB0', 'Test LED');
    
    // Spy on the controller methods to ensure proper flow
    const getHardwareVersionSpy = vi.spyOn(ledController, 'getHardwareVersion');
    
    const result = await useCase.execute({ target: 'hardware' });
    
    // Verify the method was called
    expect(getHardwareVersionSpy).toHaveBeenCalled();
    
    // Verify the response structure matches expected Arduino VERSION format
    expect(result.version).toBe('1.0.0-g1234567');
    expect(result.board).toBe('arduino-uno-r4');
    expect(result.firmware).toBe('UniversalLedControl');
    expect(result.buildDate).toBe('2024-09-14');
  });
});