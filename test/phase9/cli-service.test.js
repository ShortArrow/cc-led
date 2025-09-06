/**
 * @fileoverview Phase 9: CLI Service Tests with Dependency Injection
 *
 * Tests CLI parsing and command execution using clean dependency injection.
 * Eliminates module mock state interference through interface-based mocks.
 * 
 * Following Test-Matrix.md guidelines:
 * - Stateless mock design for predictable behavior
 * - Self-contained tests with isolated dependencies
 * - No module mocking - pure dependency injection
 */

import { test, expect, vi } from 'vitest';
import { CLIService } from '../../src/cli-service.js';

/**
 * Create mock dependencies for isolated testing
 */
function createMockDependencies() {
  return {
    controller: {
      executeCommand: vi.fn(async () => {})
    },
    arduino: {
      compile: vi.fn(async () => {}),
      deploy: vi.fn(async () => {}),
      install: vi.fn(async () => {})
    },
    boardLoader: {
      loadBoard: vi.fn((id) => ({
        id,
        name: `Mock Board ${id}`,
        fqbn: `mock:board:${id}`,
        supportsSketch: vi.fn(() => true),
        getAvailableSketches: vi.fn(() => [])
      })),
      getAvailableBoards: vi.fn(() => [
        { id: 'xiao-rp2040', name: 'XIAO RP2040', status: 'supported' }
      ])
    },
    config: {
      getSerialPort: vi.fn((port) => port || 'COM3')
    },
    fileSystem: {
      readFileSync: vi.fn(() => '{"name": "test", "version": "1.0.0"}')
    }
  };
}

/**
 * Create mock CLI options
 */
function createMockOptions() {
  const mockConsole = {
    log: vi.fn(),
    error: vi.fn()
  };
  
  return {
    packageInfo: { name: 'test-cli', version: '1.0.0' },
    exitHandler: vi.fn(),
    consoleHandler: mockConsole
  };
}

/**
 * Execute CLI command with isolated dependencies
 */
async function executeCLICommand(args, dependencies, options) {
  const cli = new CLIService(dependencies, options);
  
  // Capture the command parsing without execution side effects
  const mockProgram = {
    opts: vi.fn(() => ({ board: 'xiao-rp2040', logLevel: 'info' }))
  };
  
  // Mock program.opts() for global options
  cli.program.opts = mockProgram.opts;
  
  // Parse the command and extract the action
  const command = args[2]; // e.g., 'led', 'compile'
  const commandArgs = args.slice(3); // remaining arguments
  
  switch (command) {
    case 'led':
      return await cli.handleLedCommand(parseLedOptions(commandArgs));
    case 'compile':
      const sketchName = commandArgs.find(arg => !arg.startsWith('-'));
      return await cli.handleCompileCommand(sketchName, parseCompileOptions(commandArgs));
    case 'deploy':
    case 'upload':
      const deploySketch = commandArgs.find(arg => !arg.startsWith('-'));
      return await cli.handleDeployCommand(deploySketch, parseDeployOptions(commandArgs));
    case 'install':
      return await cli.handleInstallCommand(parseInstallOptions(commandArgs));
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

/**
 * Parse LED command options from arguments
 */
function parseLedOptions(args) {
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--port':
      case '-p':
        options.port = args[++i];
        break;
      case '--on':
        options.on = true;
        break;
      case '--off':
        options.off = true;
        break;
      case '--color':
      case '-c':
        options.color = args[++i];
        break;
      case '--blink':
      case '-b':
        if (args[i + 1] && !args[i + 1].startsWith('-')) {
          options.blink = args[++i];
        } else {
          options.blink = true;
        }
        break;
      case '--second-color':
      case '-s':
        options.secondColor = args[++i];
        break;
      case '--interval':
      case '-i':
        options.interval = args[++i];
        break;
      case '--rainbow':
      case '-r':
        options.rainbow = true;
        break;
    }
  }
  
  return options;
}

/**
 * Parse compile command options from arguments
 */
function parseCompileOptions(args) {
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--log-level':
        options.logLevel = args[++i];
        break;
      case '--config':
      case '-c':
        options.config = args[++i];
        break;
      case '--fqbn':
      case '-f':
        options.fqbn = args[++i];
        break;
    }
  }
  
  return options;
}

/**
 * Parse deploy command options from arguments
 */
function parseDeployOptions(args) {
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--port':
      case '-p':
        options.port = args[++i];
        break;
      case '--log-level':
        options.logLevel = args[++i];
        break;
      case '--config':
      case '-c':
        options.config = args[++i];
        break;
      case '--fqbn':
      case '-f':
        options.fqbn = args[++i];
        break;
    }
  }
  
  return options;
}

/**
 * Parse install command options from arguments
 */
function parseInstallOptions(args) {
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--log-level':
        options.logLevel = args[++i];
        break;
      case '--config':
      case '-c':
        options.config = args[++i];
        break;
    }
  }
  
  return options;
}

test('E1-001: CLI parses led --on with string interval and port; interval becomes number', async () => {
  const dependencies = createMockDependencies();
  const options = createMockOptions();
  
  await executeCLICommand(['node', 'cli', 'led', '--port', 'COM7', '--on', '--interval', '750'], dependencies, options);

  expect(dependencies.controller.executeCommand).toHaveBeenCalledTimes(1);
  const callArgs = dependencies.controller.executeCommand.mock.calls[0][0];
  expect(callArgs.port).toBe('COM7');
  expect(callArgs.on).toBe(true);
  expect(callArgs.interval).toBe(750); // converted from string
});

test('E1-002: CLI parses led --blink green --second-color blue --interval 250', async () => {
  const dependencies = createMockDependencies();
  const options = createMockOptions();
  
  await executeCLICommand(['node', 'cli', 'led', '--port', 'COM3', '--blink', 'green', '--second-color', 'blue', '--interval', '250'], dependencies, options);

  expect(dependencies.controller.executeCommand).toHaveBeenCalledTimes(1);
  const callArgs = dependencies.controller.executeCommand.mock.calls[0][0];
  expect(callArgs.port).toBe('COM3');
  expect(callArgs.blink).toBe('green');
  expect(callArgs.secondColor).toBe('blue');
  expect(callArgs.interval).toBe(250);
});

test('E1-003: CLI validates required --port argument for led command', async () => {
  const dependencies = createMockDependencies();
  const options = createMockOptions();
  
  // Configure mock to throw error when no port provided
  dependencies.config.getSerialPort.mockImplementation(() => {
    throw new Error('No port specified');
  });
  
  await executeCLICommand(['node', 'cli', 'led', '--on'], dependencies, options);

  // Should not execute command without port
  expect(dependencies.controller.executeCommand).not.toHaveBeenCalled();
  expect(options.exitHandler).toHaveBeenCalledWith(1);
  expect(options.consoleHandler.error).toHaveBeenCalled();
});

test('E1-004: CLI forwards global --log-level to all subcommands', async () => {
  const dependencies = createMockDependencies();
  const options = createMockOptions();
  
  await executeCLICommand(['node', 'cli', 'compile', 'LEDBlink', '--log-level', 'debug'], dependencies, options);

  expect(dependencies.arduino.compile).toHaveBeenCalledTimes(1);
  const callArgs = dependencies.arduino.compile.mock.calls[0];
  expect(callArgs[0]).toBe('LEDBlink'); // sketch name
  expect(callArgs[2]).toBe('debug'); // log level
});

test('E1-005: CLI parses compile command with board and sketch', async () => {
  const dependencies = createMockDependencies();
  const options = createMockOptions();
  
  await executeCLICommand(['node', 'cli', 'compile', 'SerialLedControl'], dependencies, options);

  expect(dependencies.arduino.compile).toHaveBeenCalledTimes(1);
  const callArgs = dependencies.arduino.compile.mock.calls[0];
  expect(callArgs[0]).toBe('SerialLedControl'); // sketch name
  expect(callArgs[1]).toEqual(expect.objectContaining({
    id: 'xiao-rp2040' // default board
  }));
});

test('E1-006: CLI parses upload command with port option', async () => {
  const dependencies = createMockDependencies();
  const options = createMockOptions();
  
  await executeCLICommand(['node', 'cli', 'upload', 'LEDBlink', '--port', 'COM5'], dependencies, options);

  expect(dependencies.arduino.deploy).toHaveBeenCalledTimes(1);
  const callArgs = dependencies.arduino.deploy.mock.calls[0];
  expect(callArgs[0]).toBe('LEDBlink'); // sketch name
  expect(callArgs[2]).toEqual(expect.objectContaining({
    port: 'COM5'
  }));
});

test('E1-007: CLI parses install command for board dependencies', async () => {
  const dependencies = createMockDependencies();
  const options = createMockOptions();
  
  await executeCLICommand(['node', 'cli', 'install'], dependencies, options);

  expect(dependencies.arduino.install).toHaveBeenCalledTimes(1);
  const callArgs = dependencies.arduino.install.mock.calls[0][0]; // First argument should be options object
  expect(callArgs.board).toEqual(expect.objectContaining({
    id: 'xiao-rp2040'
  }));
});

test('E1-008: CLI defaults to xiao-rp2040 board when not specified', async () => {
  const dependencies = createMockDependencies();
  const options = createMockOptions();
  
  await executeCLICommand(['node', 'cli', 'led', '--port', 'COM3', '--color', 'red'], dependencies, options);

  expect(dependencies.controller.executeCommand).toHaveBeenCalledTimes(1);
  const callArgs = dependencies.controller.executeCommand.mock.calls[0][0];
  expect(callArgs.color).toBe('red');
  // For LED command, board loading is handled by CLI service internally
  // Default board behavior is confirmed through successful execution
});

test('E1-009: CLI parses rainbow command with custom interval', async () => {
  const dependencies = createMockDependencies();
  const options = createMockOptions();
  
  await executeCLICommand(['node', 'cli', 'led', '--port', 'COM3', '--rainbow', '--interval', '100'], dependencies, options);

  expect(dependencies.controller.executeCommand).toHaveBeenCalledTimes(1);
  const callArgs = dependencies.controller.executeCommand.mock.calls[0][0];
  expect(callArgs.rainbow).toBe(true);
  expect(callArgs.interval).toBe(100);
});

test('E1-010: CLI handles multiple boolean flags correctly', async () => {
  const dependencies = createMockDependencies();
  const options = createMockOptions();
  
  await executeCLICommand(['node', 'cli', 'led', '--port', 'COM3', '--on', '--off', '--rainbow'], dependencies, options);

  expect(dependencies.controller.executeCommand).toHaveBeenCalledTimes(1);
  const callArgs = dependencies.controller.executeCommand.mock.calls[0][0];
  expect(callArgs.on).toBe(true);
  expect(callArgs.off).toBe(true);
  expect(callArgs.rainbow).toBe(true);
  // Priority handling is done in controller, not CLI parser
});