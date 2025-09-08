/**
 * @fileoverview Node.js FileSystem Adapter
 * 
 * Production implementation of FileSystemInterface using Node.js fs module.
 * Follows adapter pattern for Clean Architecture.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { FileSystemInterface } from '../interfaces/file-system.interface.js';

/**
 * Node.js implementation of FileSystemInterface
 */
export class NodeFileSystemAdapter extends FileSystemInterface {
  /**
   * Check if a file or directory exists using Node.js fs.existsSync
   * @param {string} path - Path to check
   * @returns {boolean} True if exists, false otherwise
   */
  existsSync(path) {
    return existsSync(path);
  }

  /**
   * Read file contents synchronously using Node.js fs.readFileSync
   * @param {string} path - File path to read
   * @param {object|string} options - Read options (encoding, etc.)
   * @returns {string|Buffer} File contents
   */
  readFileSync(path, options) {
    return readFileSync(path, options);
  }

  /**
   * Write file contents synchronously using Node.js fs.writeFileSync
   * @param {string} path - File path to write
   * @param {string|Buffer} data - Data to write
   * @param {object|string} options - Write options
   */
  writeFileSync(path, data, options) {
    return writeFileSync(path, data, options);
  }
}