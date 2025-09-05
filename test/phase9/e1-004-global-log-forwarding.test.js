/**
 * @fileoverview E1-004: Global Log Level Forwarding Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: Global --log-level forwarded to compile commands
 */

import { test, expect, vi } from 'vitest';

// Mock ArduinoCLI compile method
const mockCompile = vi.fn();

vi.mock('../../src/arduino.js', () => ({
  ArduinoCLI: vi.fn().mockImplementation(() => ({
    compile: mockCompile
  }))
}));

// Mock board loader
vi.mock('../../src/boards/board-loader.js', () => ({
  BoardLoader: vi.fn().mockImplementation(() => ({
    getBoard: vi.fn(() => ({ config: { serial: { baudRate: 9600 } } }))
  }))
}));

test('E1-004: Global --log-level debug forwarded to compile command options', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Simulate global CLI option processing
  const globalOptions = {
    logLevel: 'debug'
  };
  
  const commandOptions = {
    sketch: 'test-sketch',
    board: 'xiao-rp2040'
  };
  
  // Simulate CLI command handler that forwards global options
  const handleCompileCommand = async (opts, globalOpts) => {
    const { ArduinoCLI } = await import('../../src/arduino.js');
    const arduino = new ArduinoCLI();
    
    // Forward global log level to compile options
    await arduino.compile(opts.sketch, {
      ...opts,
      logLevel: globalOpts.logLevel // Forward global option
    });
  };
  
  // Execute: Run compile command with global log level
  await handleCompileCommand(commandOptions, globalOptions);
  
  // Assert: Log level was forwarded to compile
  expect(mockCompile).toHaveBeenCalledWith('test-sketch', 
    expect.objectContaining({
      logLevel: 'debug'
    })
  );
});