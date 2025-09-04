/**
 * @fileoverview Performance & Resource Tests
 * 
 * Tests system performance and resource management for cc-led protocol implementation.
 * Covers Test-Matrix.md P6-001 through P6-004.
 * 
 * Following Zenn article best practices for self-contained tests without timeouts.
 */

import { it, expect, vi, beforeEach } from 'vitest';

// Mock SerialPort
const MockSerialPort = vi.fn();

vi.mock('serialport', () => ({
  SerialPort: MockSerialPort
}));

vi.mock('../src/utils/config.js', () => ({
  getSerialPort: vi.fn(() => 'COM3')
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// P6-001: Response time in test environment should be under 20ms
it('P6-001: should complete response processing under 20ms in test environment', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  // Setup test environment
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';
  
  const mockWrite = vi.fn((data, callback) => {
    if (callback) callback(); // Immediate success callback
  });

  const mockSerialPortInstance = {
    write: mockWrite,
    close: vi.fn((callback) => { if (callback) callback(); }),
    on: vi.fn((event, handler) => {
      if (event === 'data') {
        setImmediate(() => handler(Buffer.from('ACCEPTED,COLOR,255,0,0')));
      }
    }),
    off: vi.fn(),
    removeListener: vi.fn(),
    isOpen: true
  };

  MockSerialPort.mockReturnValue(mockSerialPortInstance);
  
  // Measure response time
  const startTime = performance.now();
  await executeCommand({ port: 'COM3', color: 'red' });
  const endTime = performance.now();
  
  const responseTime = endTime - startTime;
  
  // Assert: Response time under 20ms in test environment (with mocks should be very fast)
  expect(responseTime).toBeLessThan(20);
  
  // Verify command was sent correctly
  expect(mockWrite).toHaveBeenCalledWith('COLOR,255,0,0\n', expect.any(Function));
  
  // Restore environment
  process.env.NODE_ENV = originalEnv;
});

// P6-002: Response time in production should be under 50ms  
it('P6-002: should complete response processing under 50ms in production environment', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  // Setup production environment
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  
  const mockWrite = vi.fn((data, callback) => {
    if (callback) callback(); // Immediate success callback
  });

  const mockSerialPortInstance = {
    write: mockWrite,
    close: vi.fn((callback) => { if (callback) callback(); }),
    on: vi.fn((event, handler) => {
      if (event === 'data') {
        setImmediate(() => handler(Buffer.from('ACCEPTED,BLINK1,255,0,0,500')));
      }
    }),
    off: vi.fn(),
    removeListener: vi.fn(),
    isOpen: true
  };

  MockSerialPort.mockReturnValue(mockSerialPortInstance);
  
  // Measure response time
  const startTime = performance.now();
  await executeCommand({ port: 'COM3', blink: 'red', interval: 500 });
  const endTime = performance.now();
  
  const responseTime = endTime - startTime;
  
  // Assert: Response time under 50ms in production environment
  expect(responseTime).toBeLessThan(50);
  
  // Verify command was sent correctly
  expect(mockWrite).toHaveBeenCalledWith('BLINK1,255,0,0,500\n', expect.any(Function));
  
  // Restore environment
  process.env.NODE_ENV = originalEnv;
});

// P6-003: Consecutive operations should not cause memory leaks
it('P6-003: should handle consecutive operations without memory leaks', async () => {
  const { executeCommand } = await import('../src/controller.js');
  
  // Record initial memory usage
  const initialMemory = process.memoryUsage();
  
  const mockWrite = vi.fn((data, callback) => {
    if (callback) callback(); // Write succeeds immediately
  });

  const mockSerialPortInstance = {
    write: mockWrite,
    close: vi.fn((callback) => { if (callback) callback(); }),
    on: vi.fn((event, handler) => {
      if (event === 'data') {
        setImmediate(() => handler(Buffer.from('ACCEPTED,COLOR,255,0,0')));
      }
    }),
    off: vi.fn(),
    removeListener: vi.fn(),
    isOpen: true
  };

  MockSerialPort.mockReturnValue(mockSerialPortInstance);
  
  // Execute multiple operations to test memory management
  const operations = [];
  for (let i = 0; i < 50; i++) { // Reduced for test speed
    const operation = executeCommand({ port: 'COM3', color: 'red' });
    operations.push(operation);
  }
  
  // Wait for all operations to complete
  await Promise.all(operations);
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  // Measure final memory usage
  const finalMemory = process.memoryUsage();
  const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
  
  // Assert: Memory growth should be reasonable (less than 5MB for 50 operations)
  expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024); // 5MB threshold
  
  // Verify commands were executed
  expect(mockWrite.mock.calls.length).toBeGreaterThanOrEqual(50);
});

// P6-004: Multiple controllers on different ports should run without interference
it('P6-004: should handle multiple controllers on different ports without interference', async () => {
  const { LedController } = await import('../src/controller.js');
  
  // Setup multiple mock serial ports for different ports
  const port1Writes = [];
  const port2Writes = [];
  const port3Writes = [];
  
  MockSerialPort.mockImplementation((config, callback) => {
    const writes = config.path === 'COM3' ? port1Writes : 
                   config.path === 'COM5' ? port2Writes : port3Writes;
    
    const mockInstance = {
      write: vi.fn((data, cb) => {
        writes.push(data);
        if (cb) cb();
      }),
      close: vi.fn((callback) => { if (callback) callback(); }),
      on: vi.fn((event, handler) => {
        if (event === 'data') {
          const response = config.path === 'COM3' ? 'ACCEPTED,COLOR,255,0,0' :
                           config.path === 'COM5' ? 'ACCEPTED,COLOR,0,255,0' :
                           'ACCEPTED,COLOR,0,0,255';
          setImmediate(() => handler(Buffer.from(response)));
        }
      }),
      off: vi.fn(),
      removeListener: vi.fn(),
      isOpen: true
    };
    
    if (callback) setImmediate(() => callback(null));
    return mockInstance;
  });
  
  // Create multiple controllers for different ports
  const controller1 = new LedController('COM3');
  const controller2 = new LedController('COM5');
  const controller3 = new LedController('COM7');
  
  // Connect all controllers concurrently
  await Promise.all([
    controller1.connect(),
    controller2.connect(),
    controller3.connect()
  ]);
  
  // Execute commands concurrently on different ports
  const results = await Promise.allSettled([
    controller1.setColor('red'),    // COM3
    controller2.setColor('green'),  // COM5
    controller3.setColor('blue')    // COM7
  ]);
  
  // Assert: All operations completed successfully
  expect(results).toHaveLength(3);
  results.forEach(result => {
    expect(result.status).toBe('fulfilled');
  });
  
  // Assert: Each port received its own command (no interference)
  expect(port1Writes).toContain('COLOR,255,0,0\n');
  expect(port2Writes).toContain('COLOR,0,255,0\n');
  expect(port3Writes).toContain('COLOR,0,0,255\n');
  
  // Assert: Commands were isolated (no cross-contamination)
  expect(port1Writes).not.toContain('COLOR,0,255,0\n');
  expect(port1Writes).not.toContain('COLOR,0,0,255\n');
  expect(port2Writes).not.toContain('COLOR,255,0,0\n');
  expect(port2Writes).not.toContain('COLOR,0,0,255\n');
  expect(port3Writes).not.toContain('COLOR,255,0,0\n');
  expect(port3Writes).not.toContain('COLOR,0,255,0\n');
});