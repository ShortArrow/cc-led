/**
 * @fileoverview CLI end-to-end parsing tests (Commander integration)
 *
 * These tests verify that CLI options are parsed and forwarded to the
 * execution layer with correct types and defaults.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock controller executeCommand to capture parsed options without touching serial
vi.mock('../src/controller.js', () => ({
  executeCommand: vi.fn(async () => {}),
}));

// Mock Arduino helpers so compile/deploy/install paths are testable without CLI
vi.mock('../src/arduino.js', () => ({
  compile: vi.fn(async () => {}),
  deploy: vi.fn(async () => {}),
  install: vi.fn(async () => {}),
}));

// Mock BoardLoader to avoid filesystem dependency while allowing board lookups
vi.mock('../src/boards/board-loader.js', () => ({
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

describe('CLI Parsing - cc-led', () => {
  const importCli = async () => {
    vi.resetModules();
    // Avoid exiting the process on errors
    vi.spyOn(process, 'exit').mockImplementationOnce(() => { throw new Error('process.exit called'); });
    return import('../src/cli.js');
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses led --on with string interval and port; interval becomes number', async () => {
    const { executeCommand } = await import('../src/controller.js');
    process.argv = ['node', 'cc-led', 'led', '--port', 'COM7', '--on', '--interval', '750'];
    await importCli();

    expect(executeCommand).toHaveBeenCalledTimes(1);
    const opts = executeCommand.mock.calls[0][0];
    expect(opts.port).toBe('COM7');
    expect(opts.on).toBe(true);
    expect(opts.interval).toBe(750); // converted from string
  });

  it('parses led --blink green --second-color blue --interval 250', async () => {
    const { executeCommand } = await import('../src/controller.js');
    process.argv = ['node', 'cc-led', 'led', '--port', 'COM3', '--blink', 'green', '--second-color', 'blue', '--interval', '250'];
    await importCli();

    expect(executeCommand).toHaveBeenCalledTimes(1);
    const opts = executeCommand.mock.calls[0][0];
    expect(opts.blink).toBe('green');
    expect(opts.secondColor).toBe('blue');
    expect(opts.interval).toBe(250);
  });

  it('errors when led command missing --port option', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    process.argv = ['node', 'cc-led', 'led', '--on'];
    await expect(importCli()).rejects.toThrow('process.exit called');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✗ Serial port is required'));
    consoleSpy.mockRestore();
  });

  it('forwards global --log-level to compile when not provided locally', async () => {
    const { compile } = await import('../src/arduino.js');
    process.argv = ['node', 'cc-led', '--log-level', 'debug', 'compile', 'LEDBlink'];
    await importCli();

    expect(compile).toHaveBeenCalledTimes(1);
    const [_sketch, opts] = compile.mock.calls[0];
    expect(opts.logLevel).toBe('debug');
    expect(opts.fqbn).toBeDefined();
  });
});

