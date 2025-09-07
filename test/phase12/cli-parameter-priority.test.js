/**
 * Phase 12: Arduino CLI Configuration Priority Tests - CLI Parameter Priority
 * 
 * Tests CLI parameter (--config-file <path>) as highest priority configuration source
 */

import { it, expect, vi } from 'vitest';
import { join } from 'path';
import { ArduinoService } from '../../src/arduino.js';
import { MockFileSystemAdapter, MockProcessExecutorAdapter } from './shared-mocks.js';


it('C2-001: should use specified config file when --config-file parameter provided', async () => {
  const mockFileSystem = new MockFileSystemAdapter();
  const mockProcessExecutor = new MockProcessExecutorAdapter();
  
  // Mock process.cwd() for this test
  const originalCwd = process.cwd;
  vi.spyOn(process, 'cwd').mockReturnValue('/test/working/directory');
  
  const customConfigPath = '/custom/path/config.yaml';
  const customConfigContent = 'directories:\n  data: /custom/data\n';
  
  mockFileSystem.addFile(customConfigPath, customConfigContent);
  
  // Create service with custom config file option
  const serviceWithCustomConfig = new ArduinoService(
    mockFileSystem, 
    mockProcessExecutor, 
    { configFile: customConfigPath }
  );
  
  await serviceWithCustomConfig.execute(['core', 'list']);
  
  const lastCommand = mockProcessExecutor.getLastCommand();
  expect(lastCommand.args).toContain('--config-file');
  // Find the index of --config-file and check the next argument
  const configFileIndex = lastCommand.args.indexOf('--config-file');
  expect(configFileIndex).toBeGreaterThan(-1);
  expect(lastCommand.args[configFileIndex + 1]).toBe(customConfigPath);
  
  // Clean up
  vi.restoreAllMocks();
  process.cwd = originalCwd;
});

it('C2-002: should throw error when specified config file does not exist', () => {
  const mockFileSystem = new MockFileSystemAdapter();
  const mockProcessExecutor = new MockProcessExecutorAdapter();
  
  const originalCwd = process.cwd;
  vi.spyOn(process, 'cwd').mockReturnValue('/test/working/directory');
  
  const missingConfigPath = '/missing/config.yaml';
  
  expect(() => {
    new ArduinoService(
      mockFileSystem, 
      mockProcessExecutor, 
      { configFile: missingConfigPath }
    );
  }).toThrow('Arduino CLI config file not found');
  
  vi.restoreAllMocks();
  process.cwd = originalCwd;
});

it('C2-006: should use CLI parameter when all config sources exist', async () => {
  const mockFileSystem = new MockFileSystemAdapter();
  const mockProcessExecutor = new MockProcessExecutorAdapter();
  
  const originalCwd = process.cwd;
  vi.spyOn(process, 'cwd').mockReturnValue('/test/working/directory');
  
  const customConfigPath = '/priority/test/config.yaml';
  const currentDirConfigPath = join(process.cwd(), 'arduino-cli.yaml');
  
  // Create all possible config sources
  mockFileSystem.addFile(customConfigPath, 'custom: config\n');
  mockFileSystem.addFile(currentDirConfigPath, 'current: dir config\n');
  
  const serviceWithCustomConfig = new ArduinoService(
    mockFileSystem, 
    mockProcessExecutor, 
    { configFile: customConfigPath }
  );
  
  await serviceWithCustomConfig.execute(['core', 'list']);
  
  const lastCommand = mockProcessExecutor.getLastCommand();
  const configFileIndex = lastCommand.args.indexOf('--config-file');
  expect(configFileIndex).toBeGreaterThan(-1);
  expect(lastCommand.args[configFileIndex + 1]).toBe(customConfigPath);
  
  vi.restoreAllMocks();
  process.cwd = originalCwd;
});