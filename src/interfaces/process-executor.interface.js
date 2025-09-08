/**
 * @fileoverview Process Executor Interface
 * 
 * Abstract interface for child process execution operations.
 * Enables dependency injection and testable design following Clean Architecture.
 */

/**
 * Abstract interface for process execution operations
 */
export class ProcessExecutorInterface {
  /**
   * Spawn a child process
   * @param {string} command - Command to execute
   * @param {string[]} args - Command arguments
   * @param {object} options - Spawn options
   * @returns {object} Child process object
   */
  spawn(command, args, options) {
    throw new Error('ProcessExecutorInterface.spawn() must be implemented');
  }

  /**
   * Execute a command synchronously
   * @param {string} command - Command to execute
   * @param {object} options - Execution options
   * @returns {object} Execution result
   */
  execSync(command, options) {
    throw new Error('ProcessExecutorInterface.execSync() must be implemented');
  }

  /**
   * Get process arguments
   * @returns {string[]} Process arguments array
   */
  getProcessArgv() {
    throw new Error('ProcessExecutorInterface.getProcessArgv() must be implemented');
  }

  /**
   * Set process arguments (for testing)
   * @param {string[]} argv - Process arguments array
   */
  setProcessArgv(argv) {
    throw new Error('ProcessExecutorInterface.setProcessArgv() must be implemented');
  }

  /**
   * Exit the process
   * @param {number} code - Exit code
   */
  exit(code) {
    throw new Error('ProcessExecutorInterface.exit() must be implemented');
  }
}