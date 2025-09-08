/**
 * Phase 12: Arduino CLI Configuration Priority Tests - Configuration Logging
 * 
 * Tests configuration transparency and logging for debugging
 */

import { it, expect, beforeEach, afterEach, vi } from 'vitest';
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
  
  arduinoService = new ArduinoService(mockFileSystem, mockProcessExecutor);
});

afterEach(() => {
  vi.restoreAllMocks();
  process.cwd = originalCwd;
});

it('C2-011: should log selected config file path for debugging', async () => {
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  
  await arduinoService.execute(['core', 'list'], 'debug');
  
  // In debug mode, should log config file selection
  expect(consoleSpy).toHaveBeenCalled();
  
  consoleSpy.mockRestore();
});