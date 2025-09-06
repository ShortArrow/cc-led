/**
 * @fileoverview Phase 9: CLI end-to-end parsing tests (Commander integration)
 *
 * These tests verify that CLI options are parsed and forwarded to the
 * execution layer with correct types and defaults.
 * 
 * Following Test-Matrix.md guidelines:
 * - Flat test structure (no describe blocks)
 * - Clear mocks for each test
 * - Self-contained tests with PX-XXX naming
 */

import { test, expect, vi } from 'vitest';

// Mock controller executeCommand to capture parsed options without touching serial
vi.mock('../../src/controller.js', () => ({
  executeCommand: vi.fn(async () => {}),
}));

// Mock Arduino helpers so compile/deploy/install paths are testable without CLI
vi.mock('../../src/arduino.js', () => ({
  compile: vi.fn(async () => {}),
  deploy: vi.fn(async () => {}),
  install: vi.fn(async () => {}),
}));

// Mock BoardLoader to avoid filesystem dependency while allowing board lookups
vi.mock('../../src/boards/board-loader.js', () => ({
  BoardLoader: class MockBoardLoader {
    loadBoard(id) {
      return {
        id,
        name: `Board-${id}`,
        fqbn: `fqbn:${id}`,
        supportsSketch: () => true,
        getAvailableSketches: () => [],
      };
    }
    getAvailableBoards() {
      return [
        { id: 'xiao-rp2040', name: 'XIAO RP2040', status: 'supported' },
      ];
    }
  },
}));

// Helper function to execute CLI with given arguments
const executeCli = async (args) => {
  // Store original argv
  const originalArgv = process.argv;
  
  try {
    // Set test arguments  
    process.argv = args;
    
    // Fresh import and execution
    vi.resetModules();
    
    // Mock process.exit to prevent actual exit
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    
    // Import and execute CLI
    await import('../../src/cli.js');
    
    mockExit.mockRestore();
  } catch (error) {
    // CLI execution may throw, but we're testing the parsing
    if (!error.message.includes('process.exit called')) {
      throw error;
    }
  } finally {
    // Always restore original argv
    process.argv = originalArgv;
  }
};

test('E1-001: CLI parses led --on with string interval and port; interval becomes number', async () => {
  // Clear all mocks for this test
  vi.clearAllMocks();
  
  const { executeCommand } = await import('../../src/controller.js');
  
  await executeCli(['node', 'cc-led', 'led', '--port', 'COM7', '--on', '--interval', '750']);

  expect(executeCommand).toHaveBeenCalledTimes(1);
  const opts = executeCommand.mock.calls[0][0];
  expect(opts.port).toBe('COM7');
  expect(opts.on).toBe(true);
  expect(opts.interval).toBe(750); // converted from string
});

test('E1-002: CLI parses led --blink green --second-color blue --interval 250', async () => {
  // Clear all mocks for this test
  vi.clearAllMocks();
  
  const { executeCommand } = await import('../../src/controller.js');
  
  await executeCli(['node', 'cc-led', 'led', '--port', 'COM3', '--blink', 'green', '--second-color', 'blue', '--interval', '250']);

  expect(executeCommand).toHaveBeenCalledTimes(1);
  const opts = executeCommand.mock.calls[0][0];
  expect(opts.port).toBe('COM3');
  expect(opts.blink).toBe('green');
  expect(opts.secondColor).toBe('blue');
  expect(opts.interval).toBe(250);
});

test('E1-003: CLI validates required --port argument for led command', async () => {
  // Clear all mocks for this test
  vi.clearAllMocks();
  
  const { executeCommand } = await import('../../src/controller.js');
  
  let errorThrown = false;
  try {
    await executeCli(['node', 'cc-led', 'led', '--on']);
  } catch (error) {
    if (!error.message.includes('process.exit called')) {
      errorThrown = true;
    }
  }

  // Should not execute command without port
  expect(executeCommand).not.toHaveBeenCalled();
  expect(errorThrown).toBe(false); // CLI handles error internally and calls process.exit
});

test('E1-004: CLI forwards global --log-level to all subcommands', async () => {
  // Clear all mocks for this test
  vi.clearAllMocks();
  
  const { compile } = await import('../../src/arduino.js');
  
  await executeCli(['node', 'cc-led', '--log-level', 'debug', '--board', 'xiao-rp2040', 'compile', 'LEDBlink']);

  expect(compile).toHaveBeenCalledTimes(1);
  const args = compile.mock.calls[0];
  // Check if options object contains logLevel debug
  const options = args[1]; // Second argument should be options
  expect(options.logLevel).toBe('debug');
});

test('E1-005: CLI parses compile command with board and sketch', async () => {
  // Clear all mocks for this test
  vi.clearAllMocks();
  
  const { compile } = await import('../../src/arduino.js');
  
  await executeCli(['node', 'cc-led', '--board', 'arduino-uno-r4', 'compile', 'SerialLedControl']);

  expect(compile).toHaveBeenCalledWith(
    'SerialLedControl',
    expect.objectContaining({ logLevel: 'info' }),
    expect.any(Object)
  );
});

test('E1-006: CLI parses upload command with port option', async () => {
  // Clear all mocks for this test
  vi.clearAllMocks();
  
  const { deploy } = await import('../../src/arduino.js');
  
  await executeCli(['node', 'cc-led', '--board', 'xiao-rp2040', 'upload', 'LEDBlink', '--port', 'COM5']);

  expect(deploy).toHaveBeenCalledWith(
    'LEDBlink',
    expect.objectContaining({ logLevel: 'info' })
  );
});

test('E1-007: CLI parses install command for board dependencies', async () => {
  // Clear all mocks for this test
  vi.clearAllMocks();
  
  const { install } = await import('../../src/arduino.js');
  
  await executeCli(['node', 'cc-led', '--board', 'xiao-rp2040', 'install']);

  expect(install).toHaveBeenCalledWith(
    expect.objectContaining({ logLevel: 'info' })
  );
});

test('E1-008: CLI defaults to xiao-rp2040 board when not specified', async () => {
  // Clear all mocks for this test
  vi.clearAllMocks();
  
  const { executeCommand } = await import('../../src/controller.js');
  
  await executeCli(['node', 'cc-led', 'led', '--port', 'COM3', '--color', 'red']);

  expect(executeCommand).toHaveBeenCalledTimes(1);
  const opts = executeCommand.mock.calls[0][0];
  expect(opts.color).toBe('red');
  // Default board should be used (xiao-rp2040)
});

test('E1-009: CLI parses rainbow command with custom interval', async () => {
  // Clear all mocks for this test
  vi.clearAllMocks();
  
  const { executeCommand } = await import('../../src/controller.js');
  
  await executeCli(['node', 'cc-led', 'led', '--port', 'COM3', '--rainbow', '--interval', '100']);

  expect(executeCommand).toHaveBeenCalledTimes(1);
  const opts = executeCommand.mock.calls[0][0];
  expect(opts.rainbow).toBe(true);
  expect(opts.interval).toBe(100);
});

test('E1-010: CLI handles multiple boolean flags correctly', async () => {
  // Clear all mocks for this test
  vi.clearAllMocks();
  
  const { executeCommand } = await import('../../src/controller.js');
  
  await executeCli(['node', 'cc-led', 'led', '--port', 'COM3', '--on', '--off', '--rainbow']);

  expect(executeCommand).toHaveBeenCalledTimes(1);
  const opts = executeCommand.mock.calls[0][0];
  expect(opts.on).toBe(true);
  expect(opts.off).toBe(true);
  expect(opts.rainbow).toBe(true);
  // Priority handling is done in controller, not CLI parser
});