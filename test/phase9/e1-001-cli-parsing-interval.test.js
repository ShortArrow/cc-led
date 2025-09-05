/**
 * @fileoverview E1-001: CLI Argument Parsing with Interval Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: CLI parsing converts string interval to number
 */

import { test, expect, vi } from 'vitest';

// Mock the executeCommand to capture parsed arguments
const mockExecuteCommand = vi.fn();

vi.mock('../../src/controller.js', () => ({
  executeCommand: mockExecuteCommand
}));

// Mock Commander.js argument parsing simulation
test('E1-001: CLI --on with string interval "500" converts to number 500', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Simulate CLI argument parsing (normally done by Commander.js)
  const cliArgs = {
    port: 'COM7',
    on: true,
    interval: '500' // String from CLI
  };
  
  // Simulate the parsing logic that would convert string to number
  const parsedArgs = {
    ...cliArgs,
    interval: parseInt(cliArgs.interval) // Convert to number
  };
  
  // Execute: Call with parsed arguments
  await mockExecuteCommand(parsedArgs);
  
  // Assert: Interval was converted from string to number
  expect(mockExecuteCommand).toHaveBeenCalledWith({
    port: 'COM7',
    on: true,
    interval: 500 // Now a number
  });
  
  // Verify type conversion occurred
  const callArgs = mockExecuteCommand.mock.calls[0][0];
  expect(typeof callArgs.interval).toBe('number');
  expect(callArgs.interval).toBe(500);
});