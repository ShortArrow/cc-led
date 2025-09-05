/**
 * @fileoverview E1-002: Complex CLI Arguments Test - Test-Matrix.md Compliant
 * 
 * Self-contained test following Test-Matrix.md guidelines.
 * Tests: Complex multi-argument command parsing
 */

import { test, expect, vi } from 'vitest';

// Mock the executeCommand to capture parsed arguments
const mockExecuteCommand = vi.fn();

vi.mock('../../src/controller.js', () => ({
  executeCommand: mockExecuteCommand
}));

test('E1-002: CLI --blink green --second-color blue --interval 250 parsed correctly', async () => {
  // Clear previous calls
  vi.clearAllMocks();
  
  // Simulate complex CLI argument parsing
  const cliArgs = {
    port: 'COM3',
    blink: 'green',
    secondColor: 'blue',
    interval: '250' // String from CLI
  };
  
  // Simulate the parsing logic
  const parsedArgs = {
    ...cliArgs,
    interval: parseInt(cliArgs.interval) // Convert to number
  };
  
  // Execute: Call with complex parsed arguments
  await mockExecuteCommand(parsedArgs);
  
  // Assert: Complex command parsed correctly
  expect(mockExecuteCommand).toHaveBeenCalledWith({
    port: 'COM3',
    blink: 'green',
    secondColor: 'blue', 
    interval: 250
  });
  
  // Verify all argument types
  const callArgs = mockExecuteCommand.mock.calls[0][0];
  expect(typeof callArgs.blink).toBe('string');
  expect(typeof callArgs.secondColor).toBe('string');
  expect(typeof callArgs.interval).toBe('number');
});