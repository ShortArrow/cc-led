/**
 * @fileoverview Phase 15: CLI --version Command Tests
 * 
 * Tests verify that --version command supports git/package options
 * and displays correct version information based on the type specified.
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

// Mock execSync for git commands
vi.mock('child_process', () => ({
  execSync: vi.fn((command) => {
    if (command.includes('git rev-parse --git-dir')) return '.git';
    if (command.includes('git describe --tags')) return '';
    if (command.includes('git rev-parse --short HEAD')) return 'f35820e';
    if (command.includes('git branch --show-current')) return 'feature/mcp-integration';
    if (command.includes('git status --porcelain')) return 'M src/file.js';
    return '';
  })
}));

test('CLI-VER-001: --version with package argument returns package.json version', async () => {
  const dependencies = {
    controller: new MockController(),
    arduino: new MockArduino(),
    boardLoader: new MockBoardLoader(),
    config: new MockConfig(),
    fileSystem: new MockFileSystem()
  };

  const mockConsole = { log: vi.fn(), error: vi.fn() };
  const cli = new CLIService(dependencies, {
    packageInfo: { name: 'cc-led', version: '0.0.5-pre' },
    consoleHandler: mockConsole,
    exitHandler: vi.fn()
  });

  await cli.parse(['node', 'cc-led', '--version', 'package']);

  expect(mockConsole.log).toHaveBeenCalledWith('0.0.5-pre');
});

test('CLI-VER-002: --version with git argument returns git version', async () => {
  const dependencies = {
    controller: new MockController(),
    arduino: new MockArduino(),
    boardLoader: new MockBoardLoader(),
    config: new MockConfig(),
    fileSystem: new MockFileSystem()
  };

  const mockConsole = { log: vi.fn(), error: vi.fn() };
  const cli = new CLIService(dependencies, {
    packageInfo: { name: 'cc-led', version: '0.0.5-pre' },
    consoleHandler: mockConsole,
    exitHandler: vi.fn()
  });

  await cli.parse(['node', 'cc-led', '--version', 'git']);

  expect(mockConsole.log).toHaveBeenCalledWith('f35820e-dirty');
});

test('CLI-VER-003: --version without argument defaults to package version', async () => {
  const dependencies = {
    controller: new MockController(),
    arduino: new MockArduino(),
    boardLoader: new MockBoardLoader(),
    config: new MockConfig(),
    fileSystem: new MockFileSystem()
  };

  const mockConsole = { log: vi.fn(), error: vi.fn() };
  const cli = new CLIService(dependencies, {
    packageInfo: { name: 'cc-led', version: '0.0.5-pre' },
    consoleHandler: mockConsole,
    exitHandler: vi.fn()
  });

  await cli.parse(['node', 'cc-led', '--version']);

  expect(mockConsole.log).toHaveBeenCalledWith('0.0.5-pre');
});

test('CLI-VER-004: -V short option works the same as --version', async () => {
  const dependencies = {
    controller: new MockController(),
    arduino: new MockArduino(),
    boardLoader: new MockBoardLoader(),
    config: new MockConfig(),
    fileSystem: new MockFileSystem()
  };

  const mockConsole = { log: vi.fn(), error: vi.fn() };
  const cli = new CLIService(dependencies, {
    packageInfo: { name: 'cc-led', version: '0.0.5-pre' },
    consoleHandler: mockConsole,
    exitHandler: vi.fn()
  });

  await cli.parse(['node', 'cc-led', '-V', 'git']);

  expect(mockConsole.log).toHaveBeenCalledWith('f35820e-dirty');
});

test('CLI-VER-005: Invalid version type shows error message', async () => {
  const dependencies = {
    controller: new MockController(),
    arduino: new MockArduino(),
    boardLoader: new MockBoardLoader(),
    config: new MockConfig(),
    fileSystem: new MockFileSystem()
  };

  const mockConsole = { log: vi.fn(), error: vi.fn() };
  const mockExit = vi.fn();
  const cli = new CLIService(dependencies, {
    packageInfo: { name: 'cc-led', version: '0.0.5-pre' },
    consoleHandler: mockConsole,
    exitHandler: mockExit
  });

  await cli.parse(['node', 'cc-led', '--version', 'invalid']);

  expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('Invalid version type: invalid'));
  expect(mockExit).toHaveBeenCalledWith(1);
});

test('CLI-VER-006: handleVersionCommand method handles package type correctly', async () => {
  const dependencies = {
    controller: new MockController(),
    arduino: new MockArduino(),
    boardLoader: new MockBoardLoader(),
    config: new MockConfig(),
    fileSystem: new MockFileSystem()
  };

  const mockConsole = { log: vi.fn(), error: vi.fn() };
  const cli = new CLIService(dependencies, {
    packageInfo: { name: 'cc-led', version: '0.0.5-pre' },
    consoleHandler: mockConsole,
    exitHandler: vi.fn()
  });

  await cli.handleVersionCommand('package');

  expect(mockConsole.log).toHaveBeenCalledWith('0.0.5-pre');
});

test('CLI-VER-007: handleVersionCommand method handles git type correctly', async () => {
  const dependencies = {
    controller: new MockController(),
    arduino: new MockArduino(),
    boardLoader: new MockBoardLoader(),
    config: new MockConfig(),
    fileSystem: new MockFileSystem()
  };

  const mockConsole = { log: vi.fn(), error: vi.fn() };
  const cli = new CLIService(dependencies, {
    packageInfo: { name: 'cc-led', version: '0.0.5-pre' },
    consoleHandler: mockConsole,
    exitHandler: vi.fn()
  });

  await cli.handleVersionCommand('git');

  expect(mockConsole.log).toHaveBeenCalledWith('f35820e-dirty');
});

test('CLI-INFO-001: cc-led info command shows comprehensive information', async () => {
  const dependencies = {
    controller: new MockController(),
    arduino: new MockArduino(),
    boardLoader: new MockBoardLoader(),
    config: new MockConfig(),
    fileSystem: new MockFileSystem()
  };

  const mockConsole = { log: vi.fn(), error: vi.fn() };
  const cli = new CLIService(dependencies, {
    packageInfo: { name: 'cc-led', version: '0.0.5-pre' },
    consoleHandler: mockConsole,
    exitHandler: vi.fn()
  });

  await cli.parse(['node', 'cc-led', 'info']);

  // Check that the comprehensive info was displayed (multiple calls expected)
  expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('📋 Project Information'));
  // Check specific information lines
  const calls = mockConsole.log.mock.calls.map(call => call[0]);
  expect(calls.some(call => call.includes('Project:'))).toBe(true);
  expect(calls.some(call => call.includes('Package Version:'))).toBe(true);
});

test('CLI-INFO-002: cc-led info --version-git returns git version only', async () => {
  const dependencies = {
    controller: new MockController(),
    arduino: new MockArduino(),
    boardLoader: new MockBoardLoader(),
    config: new MockConfig(),
    fileSystem: new MockFileSystem()
  };

  const mockConsole = { log: vi.fn(), error: vi.fn() };
  const cli = new CLIService(dependencies, {
    packageInfo: { name: 'cc-led', version: '0.0.5-pre' },
    consoleHandler: mockConsole,
    exitHandler: vi.fn()
  });

  await cli.parse(['node', 'cc-led', 'info', '--version-git']);

  expect(mockConsole.log).toHaveBeenCalledWith('f35820e-dirty');
});

test('CLI-INFO-003: cc-led info --build-flags returns Arduino build flags', async () => {
  const dependencies = {
    controller: new MockController(),
    arduino: new MockArduino(),
    boardLoader: new MockBoardLoader(),
    config: new MockConfig(),
    fileSystem: new MockFileSystem()
  };

  const mockConsole = { log: vi.fn(), error: vi.fn() };
  const cli = new CLIService(dependencies, {
    packageInfo: { name: 'cc-led', version: '0.0.5-pre' },
    consoleHandler: mockConsole,
    exitHandler: vi.fn()
  });

  await cli.parse(['node', 'cc-led', 'info', '--build-flags']);

  expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('-DFIRMWARE_VERSION='));
});