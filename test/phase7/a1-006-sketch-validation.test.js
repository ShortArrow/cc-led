/**
 * @fileoverview A1-006: Sketch Directory Validation Test with Dependency Injection
 * 
 * Tests sketch directory validation using Clean Architecture principles.
 * Uses interface-based mocks instead of module mocks for better isolation.
 * 
 * Following Test-Matrix.md guidelines:
 * - Stateless mock design for predictable behavior
 * - Self-contained tests with PX-XXX naming
 */

import { test, expect } from 'vitest';
import { ArduinoService } from '../../src/arduino.js';

// Mock adapters defined inline
class MockFileSystemAdapter {
  constructor() {
    this.existsSyncBehavior = () => false;
  }

  setExistsSyncBehavior(behavior) {
    this.existsSyncBehavior = behavior;
  }

  existsSync(path) {
    return this.existsSyncBehavior(path);
  }
}

class MockProcessExecutorAdapter {
  constructor() {
    this.commands = [];
    this.responses = new Map();
    this.spawnBehavior = null;
  }

  setResponse(command, response) {
    this.responses.set(command, response);
  }

  setSpawnBehavior(behavior) {
    this.spawnBehavior = behavior;
  }

  async exec(command, args, options = {}) {
    const fullCommand = `${command} ${args.join(' ')}`;
    this.commands.push({ command, args, options, fullCommand });
    
    const response = this.responses.get(fullCommand) || { stdout: '', stderr: '', code: 0 };
    return response;
  }

  spawn(command, args, options = {}) {
    this.commands.push({ command, args, options });
    if (this.spawnBehavior) {
      return this.spawnBehavior(command, args, options);
    }
    return this.createSuccessSpawn('', '')();
  }

  createSuccessSpawn(stdout, stderr) {
    return () => ({
      stdout: { 
        on: (event, callback) => { 
          if (event === 'data') callback(stdout); 
        } 
      },
      stderr: { 
        on: (event, callback) => { 
          if (event === 'data') callback(stderr); 
        } 
      },
      on: (event, callback) => { 
        if (event === 'close') callback(0); 
      }
    });
  }

  createErrorSpawn(code, stderr = '') {
    return () => ({
      stdout: { on: () => {} },
      stderr: { 
        on: (event, callback) => { 
          if (event === 'data') callback(stderr); 
        } 
      },
      on: (event, callback) => { 
        if (event === 'close') callback(code); 
      }
    });
  }

  getExecutedCommands() {
    return this.commands;
  }

  getSpawnCalls() {
    return this.commands;
  }

  reset() {
    this.commands = [];
    this.responses.clear();
  }
}

test('A1-006: Sketch directory validation checks directory existence', async () => {
  // Create isolated test dependencies
  const mockFileSystem = new MockFileSystemAdapter();
  const mockProcessExecutor = new MockProcessExecutorAdapter();
  
  // Setup: Configure mock to allow config files but deny sketch directory
  mockFileSystem.setExistsSyncBehavior((path) => {
    // Normalize path separators for cross-platform compatibility
    const normalizedPath = path.replace(/\\/g, '/');
    if (normalizedPath.includes('sketches/non-existent-sketch')) {
      return false; // Sketch directory does not exist
    }
    return true; // Allow other paths (config files, etc.) to exist
  });
  
  // Create service with mocked dependencies
  const arduino = new ArduinoService(mockFileSystem, mockProcessExecutor);
  
  // Execute compile and capture result
  let result;
  let error;
  try {
    result = await arduino.compile('non-existent-sketch', { fqbn: 'rp2040:rp2040:seeed_xiao_rp2040' });
  } catch (e) {
    error = e;
  }
  
  const spawnCalls = mockProcessExecutor.getSpawnCalls();
  
  // Should have thrown error for non-existent directory
  expect(error).toBeDefined();
  expect(error.message).toContain('Sketch directory does not exist');
});