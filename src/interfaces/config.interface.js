/**
 * @fileoverview Configuration Interface
 * 
 * Abstract interface for configuration loading operations.
 * Enables dependency injection and testable design following Clean Architecture.
 */

/**
 * Abstract interface for configuration loading operations
 */
export class ConfigInterface {
  /**
   * Load environment variables from a .env file
   * @param {object} options - Configuration options (path, etc.)
   * @returns {object} Result object with parsed config or error
   */
  loadDotenv(options) {
    throw new Error('ConfigInterface.loadDotenv() must be implemented');
  }

  /**
   * Get environment variable value
   * @param {string} key - Environment variable key
   * @returns {string|undefined} Environment variable value
   */
  getEnv(key) {
    throw new Error('ConfigInterface.getEnv() must be implemented');
  }

  /**
   * Set environment variable value (for testing)
   * @param {string} key - Environment variable key
   * @param {string} value - Environment variable value
   */
  setEnv(key, value) {
    throw new Error('ConfigInterface.setEnv() must be implemented');
  }

  /**
   * Delete environment variable (for testing)
   * @param {string} key - Environment variable key
   */
  deleteEnv(key) {
    throw new Error('ConfigInterface.deleteEnv() must be implemented');
  }
}