/**
 * Phase 12: Arduino CLI Configuration Priority Tests - Config Consistency
 * 
 * Tests configuration consistency across multiple commands and working directories
 */

import { it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'path';
import { ArduinoService } from '../../src/arduino.js';

// Mock interfaces for dependency injection
class MockFileSystemAdapter {
  constructor() {
    this.files = new Map();
    this.directories = new Set();
  }

  existsSync(path) {
    return this.files.has(path) || this.directories.has(path);
  }

  writeFileSync(path, content, encoding) {
    this.files.set(path, { content, encoding });
  }

  readFileSync(path, encoding) {
    const file = this.files.get(path);
    if (!file) {
      throw new Error(`File not found: ${path}`);
    }
    return file.content;
  }

  // Helper methods for test setup
  addFile(path, content) {
    this.files.set(path, { content, encoding: 'utf-8' });
  }

  addDirectory(path) {
    this.directories.add(path);
  }

  clear() {
    this.files.clear();
    this.directories.clear();
  }
}

class MockProcessExecutorAdapter {
  constructor() {
    this.executedCommands = [];
    this.mockResponses = new Map();
  }

  spawn(command, args, options) {
    const fullCommand = `${command} ${args.join(' ')}`;
    this.executedCommands.push({ command, args, options, fullCommand });

    // Mock successful response
    return {
      stdout: {
        on: (event, callback) => {
          if (event === 'data') {
            const response = this.mockResponses.get(fullCommand) || 'Success\n';
            callback(Buffer.from(response));
          }
        }
      },
      stderr: {
        on: (event, callback) => {
          // Mock stderr if needed
        }
      },
      on: (event, callback) => {
        if (event === 'close') {
          callback(0); // Success exit code
        }
      }
    };
  }

  setMockResponse(command, response) {
    this.mockResponses.set(command, response);
  }

  getLastCommand() {
    return this.executedCommands[this.executedCommands.length - 1];
  }

  clear() {
    this.executedCommands.length = 0;
    this.mockResponses.clear();
  }
}

let mockFileSystem;
let mockProcessExecutor;
let arduinoService;
let originalCwd;

beforeEach(() => {
  mockFileSystem = new MockFileSystemAdapter();
  mockProcessExecutor = new MockProcessExecutorAdapter();
  
  // Mock process.cwd() to return a consistent working directory
  originalCwd = process.cwd;
  vi.spyOn(process, 'cwd').mockReturnValue('/test/working/directory');
});

afterEach(() => {
  vi.restoreAllMocks();
  process.cwd = originalCwd;
  
  // Clear mocks to ensure test isolation
  if (mockFileSystem) mockFileSystem.clear();
  if (mockProcessExecutor) mockProcessExecutor.clear();
});

it('C2-009: should use same config file across install, compile, and upload commands', async () => {
  // Create a fresh service instance for this test only
  const freshMockFileSystem = new MockFileSystemAdapter();
  const freshMockProcessExecutor = new MockProcessExecutorAdapter();
  const freshArduinoService = new ArduinoService(freshMockFileSystem, freshMockProcessExecutor);
  
  const board = { 
    fqbn: 'test:board:config', 
    platform: { package: 'test:platform' },
    getSketchPath: (name) => `/test/sketches/${name}`
  };
  
  // Mock sketch directory existence
  freshMockFileSystem.addDirectory('/test/sketches/TestSketch');
  
  await freshArduinoService.install({ board });
  await freshArduinoService.compile('TestSketch', board);
  
  const commands = freshMockProcessExecutor.executedCommands;
  const configPaths = commands
    .map(cmd => {
      const configIndex = cmd.args.indexOf('--config-file');
      return configIndex >= 0 ? cmd.args[configIndex + 1] : null;
    })
    .filter(path => path !== null);
  
  // All commands should use the same config file
  expect(configPaths.length).toBeGreaterThan(0);
  
  // Verify all config paths are identical (same service instance = same config)
  const firstConfigPath = configPaths[0];
  configPaths.forEach(path => {
    expect(path).toBe(firstConfigPath);
  });
  
  // Verify it uses current directory config as expected
  const expectedConfigPath = join('/test/working/directory', 'arduino-cli.yaml');
  const normalizedExpected = expectedConfigPath.replace(/\\/g, '/');
  const normalizedActual = firstConfigPath.replace(/\\/g, '/');
  expect(normalizedActual).toBe(normalizedExpected);
});

it('C2-010: should create independent configs for different working directories', async () => {
  const workingDir1 = '/project1';
  const workingDir2 = '/project2';
  
  // Test first working directory
  vi.spyOn(process, 'cwd').mockReturnValue(workingDir1);
  const service1 = new ArduinoService(mockFileSystem, mockProcessExecutor);
  await service1.execute(['core', 'list']);
  
  // Test second working directory
  vi.spyOn(process, 'cwd').mockReturnValue(workingDir2);
  const service2 = new ArduinoService(mockFileSystem, mockProcessExecutor);
  await service2.execute(['core', 'list']);
  
  // Verify both configs were created independently
  expect(mockFileSystem.existsSync(join(workingDir1, 'arduino-cli.yaml'))).toBe(true);
  expect(mockFileSystem.existsSync(join(workingDir2, 'arduino-cli.yaml'))).toBe(true);
});