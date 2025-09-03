/**
 * @fileoverview Console output capture utility for testing
 * 
 * Provides utilities to capture and analyze console.log output during tests.
 * Used across multiple test files that need to verify console output.
 */

import { vi } from 'vitest';

/**
 * Creates a console output capture utility
 * @returns {Object} Object with methods to capture and restore console output
 */
export const captureConsoleOutput = () => {
  const logs = [];
  const originalLog = console.log;
  
  console.log = vi.fn((...args) => {
    logs.push(args.join(' '));
    originalLog(...args);
  });

  return {
    getLogs: () => logs,
    restore: () => { console.log = originalLog; }
  };
};

/**
 * Creates a console spy for testing console output
 * @returns {Object} Vitest spy for console.log
 */
export const createConsoleSpy = () => {
  return vi.spyOn(console, 'log');
};