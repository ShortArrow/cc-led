/**
 * Phase 12: Arduino CLI Configuration Priority Tests - Config Auto-Generation
 * 
 * Tests automatic config file generation as fallback and default config content
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
});

it('C2-005: should create config in current directory when no config exists', async () => {
  // Create service without any existing config files
  mockFileSystem.clear(); // Clear any pre-existing files
  
  const freshService = new ArduinoService(mockFileSystem, mockProcessExecutor);
  
  // Check that config was created during service construction
  expect(mockFileSystem.existsSync(join(process.cwd(), 'arduino-cli.yaml'))).toBe(true);
  
  const createdConfig = mockFileSystem.readFileSync(join(process.cwd(), 'arduino-cli.yaml'), 'utf-8');
  expect(createdConfig).toContain('directories:');
  expect(createdConfig).toContain('./.arduino/data');
});

it('C2-007: should create arduino-cli.yaml in current working directory', async () => {
  const expectedConfigPath = join(process.cwd(), 'arduino-cli.yaml');
  
  // Clear file system and create fresh service
  mockFileSystem.clear();
  const freshService = new ArduinoService(mockFileSystem, mockProcessExecutor);
  
  // Verify config was created during construction
  expect(mockFileSystem.existsSync(expectedConfigPath)).toBe(true);
  
  const configContent = mockFileSystem.readFileSync(expectedConfigPath, 'utf-8');
  expect(configContent).toContain('directories:');
  expect(configContent).toContain('board_manager:');
  expect(configContent).toContain('additional_urls:');
});

it('C2-008: should generate config with required board manager URLs and directories', async () => {
  // Clear file system and create fresh service
  mockFileSystem.clear();
  const arduinoService = new ArduinoService(mockFileSystem, mockProcessExecutor);
  
  // Service creates config during construction, verify it exists
  const configPath = join(process.cwd(), 'arduino-cli.yaml');
  expect(mockFileSystem.existsSync(configPath)).toBe(true);
  
  const configContent = mockFileSystem.readFileSync(configPath, 'utf-8');
  
  // Verify essential config sections
  expect(configContent).toContain('directories:');
  expect(configContent).toContain('data: ./.arduino/data');
  expect(configContent).toContain('downloads: ./.arduino/data/downloads');
  expect(configContent).toContain('user: ./.arduino/data');
  expect(configContent).toContain('board_manager:');
  expect(configContent).toContain('additional_urls:');
  expect(configContent).toContain('package_rp2040_index.json');
  expect(configContent).toContain('package_seeeduino_boards_index.json');
});