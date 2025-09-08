/**
 * @fileoverview FileSystem Interface
 * 
 * Abstract interface for file system operations.
 * Enables dependency injection and testable design following Clean Architecture.
 */

/**
 * Abstract interface for file system operations
 */
export class FileSystemInterface {
  /**
   * Check if a file or directory exists
   * @param {string} path - Path to check
   * @returns {boolean} True if exists, false otherwise
   */
  existsSync(path) {
    throw new Error('FileSystemInterface.existsSync() must be implemented');
  }

  /**
   * Read file contents synchronously
   * @param {string} path - File path to read
   * @param {object|string} options - Read options (encoding, etc.)
   * @returns {string|Buffer} File contents
   */
  readFileSync(path, options) {
    throw new Error('FileSystemInterface.readFileSync() must be implemented');
  }

  /**
   * Write file contents synchronously
   * @param {string} path - File path to write
   * @param {string|Buffer} data - Data to write
   * @param {object|string} options - Write options
   */
  writeFileSync(path, data, options) {
    throw new Error('FileSystemInterface.writeFileSync() must be implemented');
  }
}