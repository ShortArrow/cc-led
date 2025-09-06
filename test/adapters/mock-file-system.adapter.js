/**
 * @fileoverview Mock FileSystem Adapter for Testing
 * 
 * Test implementation of FileSystemInterface with controllable behavior.
 * Enables isolated testing without real file system dependencies.
 */

import { FileSystemInterface } from '../../src/interfaces/file-system.interface.js';

/**
 * Mock implementation of FileSystemInterface for testing
 */
export class MockFileSystemAdapter extends FileSystemInterface {
  constructor() {
    super();
    this.mockFiles = new Map(); // path -> content mapping
    this.mockExistsSync = (path) => this.mockFiles.has(path);
    this.mockReadFileSync = (path, options) => {
      if (!this.mockFiles.has(path)) {
        throw new Error(`ENOENT: no such file or directory, open '${path}'`);
      }
      return this.mockFiles.get(path);
    };
    this.mockWriteFileSync = (path, data, options) => {
      this.mockFiles.set(path, data);
    };
  }

  /**
   * Mock existsSync with controllable behavior
   * @param {string} path - Path to check
   * @returns {boolean} True if mock file exists
   */
  existsSync(path) {
    return this.mockExistsSync(path);
  }

  /**
   * Mock readFileSync with controllable behavior
   * @param {string} path - File path to read
   * @param {object|string} options - Read options
   * @returns {string|Buffer} Mock file contents
   */
  readFileSync(path, options) {
    return this.mockReadFileSync(path, options);
  }

  /**
   * Mock writeFileSync with controllable behavior
   * @param {string} path - File path to write
   * @param {string|Buffer} data - Data to write
   * @param {object|string} options - Write options
   */
  writeFileSync(path, data, options) {
    return this.mockWriteFileSync(path, data, options);
  }

  /**
   * Add a mock file to the file system
   * @param {string} path - File path
   * @param {string} content - File content
   */
  addMockFile(path, content) {
    this.mockFiles.set(path, content);
  }

  /**
   * Remove a mock file from the file system
   * @param {string} path - File path
   */
  removeMockFile(path) {
    this.mockFiles.delete(path);
  }

  /**
   * Clear all mock files
   */
  clearMockFiles() {
    this.mockFiles.clear();
  }

  /**
   * Set custom existsSync behavior
   * @param {function} fn - Custom existsSync function
   */
  setExistsSyncBehavior(fn) {
    this.mockExistsSync = fn;
  }

  /**
   * Set custom readFileSync behavior  
   * @param {function} fn - Custom readFileSync function
   */
  setReadFileSyncBehavior(fn) {
    this.mockReadFileSync = fn;
  }

  /**
   * Set custom writeFileSync behavior
   * @param {function} fn - Custom writeFileSync function
   */
  setWriteFileSyncBehavior(fn) {
    this.mockWriteFileSync = fn;
  }
}