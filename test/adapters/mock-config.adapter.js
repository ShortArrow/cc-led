/**
 * @fileoverview Mock Configuration Adapter for Testing
 * 
 * Test implementation of ConfigInterface with controllable behavior.
 * Enables isolated testing without real environment variable dependencies.
 */

import { ConfigInterface } from '../../src/interfaces/config.interface.js';

/**
 * Mock implementation of ConfigInterface for testing
 */
export class MockConfigAdapter extends ConfigInterface {
  constructor() {
    super();
    this.mockEnv = new Map(); // key -> value mapping
    this.mockLoadDotenv = () => {};
  }

  /**
   * Mock loadDotenv with controllable behavior
   * @param {object} options - Configuration options (path, etc.)
   * @returns {object} Mock result object
   */
  loadDotenv(options) {
    return this.mockLoadDotenv(options);
  }

  /**
   * Get mock environment variable value
   * @param {string} key - Environment variable key
   * @returns {string|undefined} Mock environment variable value
   */
  getEnv(key) {
    return this.mockEnv.get(key);
  }

  /**
   * Set mock environment variable value
   * @param {string} key - Environment variable key
   * @param {string} value - Environment variable value
   */
  setEnv(key, value) {
    this.mockEnv.set(key, value);
  }

  /**
   * Delete mock environment variable
   * @param {string} key - Environment variable key
   */
  deleteEnv(key) {
    this.mockEnv.delete(key);
  }

  /**
   * Clear all mock environment variables
   */
  clearEnv() {
    this.mockEnv.clear();
  }

  /**
   * Set multiple mock environment variables
   * @param {object} envVars - Object with key-value pairs
   */
  setEnvVars(envVars) {
    for (const [key, value] of Object.entries(envVars)) {
      this.setEnv(key, value);
    }
  }

  /**
   * Set custom loadDotenv behavior
   * @param {function} fn - Custom loadDotenv function
   */
  setLoadDotenvBehavior(fn) {
    this.mockLoadDotenv = fn;
  }

  /**
   * Get all mock environment variables
   * @returns {object} Object with all mock environment variables
   */
  getAllEnv() {
    return Object.fromEntries(this.mockEnv);
  }
}