/**
 * @fileoverview Node.js Process Executor Adapter
 * 
 * Production implementation of ProcessExecutorInterface using Node.js child_process.
 * Follows adapter pattern for Clean Architecture.
 */

import { spawn, execSync } from 'child_process';
import { ProcessExecutorInterface } from '../interfaces/process-executor.interface.js';

/**
 * Node.js implementation of ProcessExecutorInterface
 */
export class NodeProcessExecutorAdapter extends ProcessExecutorInterface {
  /**
   * Spawn a child process using Node.js child_process.spawn
   * @param {string} command - Command to execute
   * @param {string[]} args - Command arguments
   * @param {object} options - Spawn options
   * @returns {object} Child process object
   */
  spawn(command, args, options) {
    return spawn(command, args, options);
  }

  /**
   * Execute a command synchronously using Node.js child_process.execSync
   * @param {string} command - Command to execute
   * @param {object} options - Execution options
   * @returns {object} Execution result
   */
  execSync(command, options) {
    return execSync(command, options);
  }

  /**
   * Get process arguments from process.argv
   * @returns {string[]} Process arguments array
   */
  getProcessArgv() {
    return process.argv;
  }

  /**
   * Set process arguments (for testing scenarios)
   * @param {string[]} argv - Process arguments array
   */
  setProcessArgv(argv) {
    process.argv = argv;
  }

  /**
   * Exit the process using process.exit
   * @param {number} code - Exit code
   */
  exit(code) {
    process.exit(code);
  }
}