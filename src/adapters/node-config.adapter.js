/**
 * @fileoverview Node.js Configuration Adapter
 * 
 * Production implementation of ConfigInterface using dotenv and process.env.
 * Follows adapter pattern for Clean Architecture.
 */

import { config } from 'dotenv';
import { ConfigInterface } from '../interfaces/config.interface.js';

/**
 * Node.js implementation of ConfigInterface
 */
export class NodeConfigAdapter extends ConfigInterface {
  /**
   * Load environment variables from a .env file using dotenv
   * @param {object} options - Configuration options (path, etc.)
   * @returns {object} Result object with parsed config or error
   */
  loadDotenv(options) {
    return config(options);
  }

  /**
   * Get environment variable value from process.env
   * @param {string} key - Environment variable key
   * @returns {string|undefined} Environment variable value
   */
  getEnv(key) {
    return process.env[key];
  }

  /**
   * Set environment variable value in process.env
   * @param {string} key - Environment variable key
   * @param {string} value - Environment variable value
   */
  setEnv(key, value) {
    process.env[key] = value;
  }

  /**
   * Delete environment variable from process.env
   * @param {string} key - Environment variable key
   */
  deleteEnv(key) {
    delete process.env[key];
  }
}