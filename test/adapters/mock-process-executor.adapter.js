/**
 * @fileoverview Mock Process Executor Adapter for Testing
 * 
 * Test implementation of ProcessExecutorInterface with controllable behavior.
 * Enables isolated testing without real process execution dependencies.
 */

import { ProcessExecutorInterface } from '../../src/interfaces/process-executor.interface.js';
import { EventEmitter } from 'events';

/**
 * Mock child process for spawn operations
 */
class MockChildProcess extends EventEmitter {
  constructor() {
    super();
    this.stdout = new EventEmitter();
    this.stderr = new EventEmitter();
    this.stdin = { write: () => {}, end: () => {} };
    this.killed = false;
    this.exitCode = null;
    this.pid = Math.floor(Math.random() * 10000);
  }

  kill() {
    this.killed = true;
    this.emit('close', 0);
  }
}

/**
 * Mock implementation of ProcessExecutorInterface for testing
 */
export class MockProcessExecutorAdapter extends ProcessExecutorInterface {
  constructor() {
    super();
    this.mockSpawn = this.defaultMockSpawn.bind(this);
    this.mockExecSync = this.defaultMockExecSync.bind(this);
    this.mockArgv = ['node', 'test-script'];
    this.spawnCalls = [];
    this.execSyncCalls = [];
  }

  /**
   * Default mock spawn behavior
   * @param {string} command - Command to execute
   * @param {string[]} args - Command arguments
   * @param {object} options - Spawn options
   * @returns {MockChildProcess} Mock child process
   */
  defaultMockSpawn(command, args, options) {
    const mockProcess = new MockChildProcess();
    this.spawnCalls.push({ command, args, options });
    
    // Simulate successful execution by default
    setTimeout(() => {
      mockProcess.emit('close', 0);
    }, 10);
    
    return mockProcess;
  }

  /**
   * Default mock execSync behavior
   * @param {string} command - Command to execute
   * @param {object} options - Execution options
   * @returns {Buffer} Mock output
   */
  defaultMockExecSync(command, options) {
    this.execSyncCalls.push({ command, options });
    return Buffer.from('Mock execution output');
  }

  /**
   * Mock spawn a child process
   * @param {string} command - Command to execute
   * @param {string[]} args - Command arguments
   * @param {object} options - Spawn options
   * @returns {MockChildProcess} Mock child process
   */
  spawn(command, args, options) {
    return this.mockSpawn(command, args, options);
  }

  /**
   * Mock execute a command synchronously
   * @param {string} command - Command to execute
   * @param {object} options - Execution options
   * @returns {Buffer} Mock execution result
   */
  execSync(command, options) {
    return this.mockExecSync(command, options);
  }

  /**
   * Get mock process arguments
   * @returns {string[]} Mock process arguments array
   */
  getProcessArgv() {
    return [...this.mockArgv];
  }

  /**
   * Set mock process arguments
   * @param {string[]} argv - Process arguments array
   */
  setProcessArgv(argv) {
    this.mockArgv = [...argv];
  }

  /**
   * Mock exit the process (no-op in tests)
   * @param {number} code - Exit code
   */
  exit(code) {
    // In tests, we don't actually exit - just record the call
    this.exitCode = code;
  }

  /**
   * Set custom spawn behavior
   * @param {function} fn - Custom spawn function
   */
  setSpawnBehavior(fn) {
    this.mockSpawn = fn;
  }

  /**
   * Set custom execSync behavior
   * @param {function} fn - Custom execSync function
   */
  setExecSyncBehavior(fn) {
    this.mockExecSync = fn;
  }

  /**
   * Get all spawn calls made during test
   * @returns {array} Array of spawn call objects
   */
  getSpawnCalls() {
    return [...this.spawnCalls];
  }

  /**
   * Get all execSync calls made during test
   * @returns {array} Array of execSync call objects
   */
  getExecSyncCalls() {
    return [...this.execSyncCalls];
  }

  /**
   * Clear all recorded calls
   */
  clearCalls() {
    this.spawnCalls = [];
    this.execSyncCalls = [];
  }

  /**
   * Get the exit code from mock exit call
   * @returns {number|null} Exit code or null if not called
   */
  getExitCode() {
    return this.exitCode;
  }

  /**
   * Create a spawn behavior that simulates failure
   * @param {number} exitCode - Exit code to simulate
   * @param {string} errorMessage - Error message to emit
   * @returns {function} Spawn behavior function
   */
  createFailureSpawn(exitCode, errorMessage) {
    return (command, args, options) => {
      const mockProcess = new MockChildProcess();
      this.spawnCalls.push({ command, args, options });
      
      setTimeout(() => {
        if (errorMessage) {
          mockProcess.stderr.emit('data', Buffer.from(errorMessage));
        }
        mockProcess.emit('close', exitCode);
      }, 10);
      
      return mockProcess;
    };
  }

  /**
   * Create a spawn behavior that simulates success with output
   * @param {string} stdout - Standard output to emit
   * @param {string} stderr - Standard error to emit
   * @returns {function} Spawn behavior function
   */
  createSuccessSpawn(stdout, stderr) {
    return (command, args, options) => {
      const mockProcess = new MockChildProcess();
      this.spawnCalls.push({ command, args, options });
      
      setTimeout(() => {
        if (stdout) {
          mockProcess.stdout.emit('data', Buffer.from(stdout));
        }
        if (stderr) {
          mockProcess.stderr.emit('data', Buffer.from(stderr));
        }
        mockProcess.emit('close', 0);
      }, 10);
      
      return mockProcess;
    };
  }
}