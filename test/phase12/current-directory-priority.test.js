/**
 * Phase 12: Arduino CLI Configuration Priority Tests - Current Directory Priority
 * 
 * Tests current directory (./arduino-cli.yaml) as second priority configuration source
 */

import { it, expect, vi } from 'vitest';
import { join } from 'path';
import { ArduinoService } from '../../src/arduino.js';
import { MockFileSystemAdapter, MockProcessExecutorAdapter } from './shared-mocks.js';


it('C2-003: should use ./arduino-cli.yaml when present and no CLI parameter', async () => {
  const mockFileSystem = new MockFileSystemAdapter();
  const mockProcessExecutor = new MockProcessExecutorAdapter();
  
  const originalCwd = process.cwd;
  vi.spyOn(process, 'cwd').mockReturnValue('/test/working/directory');
  
  const currentDirConfig = './arduino-cli.yaml';
  const configContent = 'directories:\n  data: ./.arduino/data\n';
  
  mockFileSystem.addFile(join(process.cwd(), 'arduino-cli.yaml'), configContent);
  
  const arduinoService = new ArduinoService(mockFileSystem, mockProcessExecutor);
  await arduinoService.execute(['core', 'list']);
  
  const lastCommand = mockProcessExecutor.getLastCommand();
  expect(lastCommand.args).toContain('--config-file');
  
  const configFileIndex = lastCommand.args.indexOf('--config-file');
  expect(configFileIndex).toBeGreaterThan(-1);
  expect(lastCommand.args[configFileIndex + 1]).toBe(join(process.cwd(), 'arduino-cli.yaml'));
  
  vi.restoreAllMocks();
  process.cwd = originalCwd;
});

it('C2-004: should handle malformed current directory config gracefully', () => {
  const mockFileSystem = new MockFileSystemAdapter();
  const mockProcessExecutor = new MockProcessExecutorAdapter();
  
  const originalCwd = process.cwd;
  vi.spyOn(process, 'cwd').mockReturnValue('/test/working/directory');
  
  const currentDirConfigPath = join(process.cwd(), 'arduino-cli.yaml');
  const malformedContent = 'invalid: yaml: content: [';
  
  mockFileSystem.addFile(currentDirConfigPath, malformedContent);
  
  // Service should still create but may log warnings
  expect(() => {
    new ArduinoService(mockFileSystem, mockProcessExecutor);
  }).not.toThrow();
  
  vi.restoreAllMocks();
  process.cwd = originalCwd;
});