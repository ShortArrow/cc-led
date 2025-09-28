/**
 * @fileoverview Phase 15: CLI VERSION Option Tests
 * 
 * Tests verify that --firmware-version option is properly parsed by the CLI
 * and integrated into the command system with correct precedence.
 */

import { test, expect, vi } from 'vitest';
import { CLIService } from '../../src/cli-service.js';

// Mock dependencies for CLI service
class MockController {
  async executeCommand(options) {
    this.lastOptions = options;
  }
}

class MockArduino {
  async compile() {}
  async deploy() {}
  async install() {}
}

class MockBoardLoader {
  getAvailableBoards() { return []; }
  loadBoard() { return { name: 'Test Board', fqbn: 'test:test:test' }; }
}

class MockConfig {
  getSerialPort(port) { return port || 'COM3'; }
}

class MockFileSystem {
  existsSync() { return true; }
}

test('CLI-V1-001: CLI service includes version option in LED command setup', () => {
  const dependencies = {
    controller: new MockController(),
    arduino: new MockArduino(),
    boardLoader: new MockBoardLoader(),
    config: new MockConfig(),
    fileSystem: new MockFileSystem()
  };

  const cli = new CLIService(dependencies, {
    packageInfo: { name: 'cc-led', version: '1.0.0' },
    consoleHandler: { log: () => {}, error: () => {} },
    exitHandler: () => {}
  });

  // Verify CLI service contains the version option in its program
  const ledCommand = cli.program.commands.find(cmd => cmd.name() === 'led');
  const versionOption = ledCommand.options.find(opt => opt.long === '--firmware-version');
  
  expect(versionOption).toBeDefined();
  expect(versionOption.description).toBe('Get microcontroller firmware version information');
});

test('CLI-V1-002: LED command options include version along with other options', () => {
  const dependencies = {
    controller: new MockController(),
    arduino: new MockArduino(),
    boardLoader: new MockBoardLoader(),
    config: new MockConfig(),
    fileSystem: new MockFileSystem()
  };

  const cli = new CLIService(dependencies);

  const ledCommand = cli.program.commands.find(cmd => cmd.name() === 'led');
  const optionNames = ledCommand.options.map(opt => opt.long);
  
  // Verify version option exists alongside other options
  expect(optionNames).toContain('--firmware-version');
  expect(optionNames).toContain('--color');
  expect(optionNames).toContain('--blink');
  expect(optionNames).toContain('--on');
  expect(optionNames).toContain('--off');
  expect(optionNames).toContain('--rainbow');
});

test('CLI-V1-003: Version option is properly defined in setupCommandsForParsing', async () => {
  const dependencies = {
    controller: new MockController(),
    arduino: new MockArduino(),
    boardLoader: new MockBoardLoader(),
    config: new MockConfig(),
    fileSystem: new MockFileSystem()
  };

  const cli = new CLIService(dependencies);

  // Check that setupCommandsForParsing includes the version option
  const { Command } = await import('commander');
  const testProgram = new Command();
  cli.setupCommandsForParsing(testProgram);
  
  const ledCommand = testProgram.commands.find(cmd => cmd.name() === 'led');
  const versionOption = ledCommand.options.find(opt => opt.long === '--firmware-version');
  
  expect(versionOption).toBeDefined();
  expect(versionOption.description).toBe('Get microcontroller firmware version information');
});

test('CLI-V1-004: LED command action handler receives version option', async () => {
  const mockController = new MockController();
  const dependencies = {
    controller: mockController,
    arduino: new MockArduino(),
    boardLoader: new MockBoardLoader(),
    config: new MockConfig(),
    fileSystem: new MockFileSystem()
  };

  const mockConsole = { log: vi.fn(), error: vi.fn() };
  const cli = new CLIService(dependencies, {
    consoleHandler: mockConsole,
    exitHandler: vi.fn()
  });

  // Simulate version option being passed to handler
  const testOptions = {
    port: 'COM3',
    firmwareVersion: true,
    interval: '500'
  };

  await cli.handleLedCommand(testOptions);

  // Verify controller received the version option
  expect(mockController.lastOptions).toEqual(testOptions);
});