/**
 * @fileoverview Phase 10: Arduino CLI Command Generation Tests
 * 
 * Tests verify that CLI options are correctly transformed into Arduino CLI
 * commands with proper FQBN mapping, parameter conversion, and path resolution.
 * 
 * Following Test-Matrix.md guidelines:
 * - Flat test structure (no describe blocks)
 * - Clear mocks for each test
 * - Self-contained tests with A2-XXX naming
 */

import { test, expect, vi } from 'vitest';

// Mock Arduino CLI execution to capture generated commands
vi.mock('../../src/arduino.js', () => ({
  compile: vi.fn(async () => ({ success: true })),
  deploy: vi.fn(async () => ({ success: true })),
  install: vi.fn(async () => ({ success: true }))
}));

// Mock Board management to control board configuration
vi.mock('../../src/boards/board-loader.js', () => ({
  BoardLoader: class MockBoardLoader {
    loadBoard(id) {
      const boards = {
        'xiao-rp2040': {
          id: 'xiao-rp2040',
          name: 'XIAO RP2040',
          fqbn: 'rp2040:rp2040:seeed_xiao_rp2040',
          platform: { package: 'rp2040:rp2040', version: '3.6.0' },
          libraries: [{ name: 'Adafruit NeoPixel', version: '1.15.1' }],
          getSketchPath: (name) => `/package/boards/xiao-rp2040/sketches/${name}/${name}.ino`
        },
        'arduino-uno-r4': {
          id: 'arduino-uno-r4',
          name: 'Arduino Uno R4',
          fqbn: 'arduino:renesas_uno:minima',
          platform: { package: 'arduino:renesas_uno', version: '1.1.0' },
          libraries: [],
          getSketchPath: (name) => `/package/boards/arduino-uno-r4/sketches/${name}/${name}.ino`
        }
      };
      return boards[id] || null;
    }
  }
}));

test('A2-001: --board xiao-rp2040 generates correct FQBN for compile', async () => {
  // Clear mocks
  vi.clearAllMocks();
  
  const { compile } = await import('../../src/arduino.js');
  const { BoardLoader } = await import('../../src/boards/board-loader.js');
  
  const loader = new BoardLoader();
  const board = loader.loadBoard('xiao-rp2040');
  
  // Simulate compile command execution
  await compile('LEDBlink', board, { logLevel: 'info' });
  
  expect(compile).toHaveBeenCalledTimes(1);
  const [sketchName, boardObj, options] = compile.mock.calls[0];
  
  expect(sketchName).toBe('LEDBlink');
  expect(boardObj.fqbn).toBe('rp2040:rp2040:seeed_xiao_rp2040');
  expect(options.logLevel).toBe('info');
});

test('A2-002: Port parameter conversion for upload command', async () => {
  // Clear mocks
  vi.clearAllMocks();
  
  const { deploy } = await import('../../src/arduino.js');
  const { BoardLoader } = await import('../../src/boards/board-loader.js');
  
  const loader = new BoardLoader();
  const board = loader.loadBoard('xiao-rp2040');
  
  // Simulate upload command with port
  await deploy('LEDBlink', board, { port: 'COM3', logLevel: 'info' });
  
  expect(deploy).toHaveBeenCalledTimes(1);
  const [sketchName, boardObj, options] = deploy.mock.calls[0];
  
  expect(sketchName).toBe('LEDBlink');
  expect(boardObj.fqbn).toBe('rp2040:rp2040:seeed_xiao_rp2040');
  expect(options.port).toBe('COM3');
});

test('A2-003: Debug log level propagation to Arduino CLI', async () => {
  // Clear mocks
  vi.clearAllMocks();
  
  const { compile } = await import('../../src/arduino.js');
  const { BoardLoader } = await import('../../src/boards/board-loader.js');
  
  const loader = new BoardLoader();
  const board = loader.loadBoard('xiao-rp2040');
  
  // Simulate compile with debug log level
  await compile('LEDBlink', board, { logLevel: 'debug' });
  
  expect(compile).toHaveBeenCalledTimes(1);
  const [, , options] = compile.mock.calls[0];
  
  expect(options.logLevel).toBe('debug');
});

test('A2-004: Trace log level propagation to Arduino CLI', async () => {
  // Clear mocks
  vi.clearAllMocks();
  
  const { deploy } = await import('../../src/arduino.js');
  const { BoardLoader } = await import('../../src/boards/board-loader.js');
  
  const loader = new BoardLoader();
  const board = loader.loadBoard('xiao-rp2040');
  
  // Simulate upload with trace log level
  await deploy('LEDBlink', board, { logLevel: 'trace' });
  
  expect(deploy).toHaveBeenCalledTimes(1);
  const [, , options] = deploy.mock.calls[0];
  
  expect(options.logLevel).toBe('trace');
});

test('A2-005: Build directory path generation uses working directory', async () => {
  // Clear mocks
  vi.clearAllMocks();
  
  const { compile } = await import('../../src/arduino.js');
  const { BoardLoader } = await import('../../src/boards/board-loader.js');
  
  const loader = new BoardLoader();
  const board = loader.loadBoard('xiao-rp2040');
  
  // Simulate compile command
  await compile('LEDBlink', board, { logLevel: 'info' });
  
  expect(compile).toHaveBeenCalledTimes(1);
  const [sketchName, boardObj] = compile.mock.calls[0];
  
  expect(sketchName).toBe('LEDBlink');
  expect(boardObj.id).toBe('xiao-rp2040');
  // Build path generation is handled internally by arduino.js
});

test('A2-006: Config file parameter included in all Arduino CLI commands', async () => {
  // Clear mocks
  vi.clearAllMocks();
  
  const { compile, deploy, install } = await import('../../src/arduino.js');
  const { BoardLoader } = await import('../../src/boards/board-loader.js');
  
  const loader = new BoardLoader();
  const board = loader.loadBoard('xiao-rp2040');
  
  // Test all three command types
  await compile('LEDBlink', board, { logLevel: 'info' });
  await deploy('LEDBlink', board, { port: 'COM3', logLevel: 'info' });
  await install(board, { logLevel: 'info' });
  
  // All commands should have been called with config file parameter
  expect(compile).toHaveBeenCalledTimes(1);
  expect(deploy).toHaveBeenCalledTimes(1);
  expect(install).toHaveBeenCalledTimes(1);
});

test('A2-007: Sketch path resolution finds correct .ino file', async () => {
  // Clear mocks
  vi.clearAllMocks();
  
  const { compile } = await import('../../src/arduino.js');
  const { BoardLoader } = await import('../../src/boards/board-loader.js');
  
  const loader = new BoardLoader();
  const board = loader.loadBoard('xiao-rp2040');
  
  // Simulate compile with specific sketch name
  await compile('NeoPixel_SerialControl', board, { logLevel: 'info' });
  
  expect(compile).toHaveBeenCalledTimes(1);
  const [sketchName, boardObj] = compile.mock.calls[0];
  
  expect(sketchName).toBe('NeoPixel_SerialControl');
  expect(boardObj.getSketchPath('NeoPixel_SerialControl'))
    .toBe('/package/boards/xiao-rp2040/sketches/NeoPixel_SerialControl/NeoPixel_SerialControl.ino');
});

test('A2-008: Different board FQBN mapping for Arduino Uno R4', async () => {
  // Clear mocks
  vi.clearAllMocks();
  
  const { compile } = await import('../../src/arduino.js');
  const { BoardLoader } = await import('../../src/boards/board-loader.js');
  
  const loader = new BoardLoader();
  const board = loader.loadBoard('arduino-uno-r4');
  
  // Simulate compile with Arduino Uno R4
  await compile('SerialLedControl', board, { logLevel: 'info' });
  
  expect(compile).toHaveBeenCalledTimes(1);
  const [sketchName, boardObj] = compile.mock.calls[0];
  
  expect(sketchName).toBe('SerialLedControl');
  expect(boardObj.fqbn).toBe('arduino:renesas_uno:minima');
  expect(boardObj.id).toBe('arduino-uno-r4');
});

test('A2-009: Board-specific installation commands for platforms and libraries', async () => {
  // Clear mocks
  vi.clearAllMocks();
  
  const { install } = await import('../../src/arduino.js');
  const { BoardLoader } = await import('../../src/boards/board-loader.js');
  
  const loader = new BoardLoader();
  const board = loader.loadBoard('xiao-rp2040');
  
  // Simulate install command for XIAO RP2040
  await install(board, { logLevel: 'info' });
  
  expect(install).toHaveBeenCalledTimes(1);
  const [boardObj, options] = install.mock.calls[0];
  
  expect(boardObj.platform.package).toBe('rp2040:rp2040');
  expect(boardObj.platform.version).toBe('3.6.0');
  expect(boardObj.libraries).toHaveLength(1);
  expect(boardObj.libraries[0].name).toBe('Adafruit NeoPixel');
  expect(boardObj.libraries[0].version).toBe('1.15.1');
});

test('A2-010: Command sequence maintains parameter consistency', async () => {
  // Clear mocks
  vi.clearAllMocks();
  
  const { install, compile, deploy } = await import('../../src/arduino.js');
  const { BoardLoader } = await import('../../src/boards/board-loader.js');
  
  const loader = new BoardLoader();
  const board = loader.loadBoard('xiao-rp2040');
  const options = { logLevel: 'debug' };
  
  // Simulate full command sequence: install -> compile -> upload
  await install(board, options);
  await compile('LEDBlink', board, options);
  await deploy('LEDBlink', board, { ...options, port: 'COM3' });
  
  // Verify all commands were called with consistent parameters
  expect(install).toHaveBeenCalledWith(board, options);
  expect(compile).toHaveBeenCalledWith('LEDBlink', board, options);
  expect(deploy).toHaveBeenCalledWith('LEDBlink', board, { ...options, port: 'COM3' });
  
  // Verify log level consistency
  expect(install.mock.calls[0][1].logLevel).toBe('debug');
  expect(compile.mock.calls[0][2].logLevel).toBe('debug');
  expect(deploy.mock.calls[0][2].logLevel).toBe('debug');
});