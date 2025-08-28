/**
 * @fileoverview Arduino CLI wrapper tests
 * 
 * These tests verify the Arduino CLI integration for compiling, uploading,
 * and managing Arduino sketches for the XIAO RP2040 board.
 * All tests use mocked child_process.spawn to avoid actual Arduino CLI calls.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ArduinoCLI, compile, deploy, install } from '../src/arduino.js';
import { spawn } from 'child_process';
import { existsSync } from 'fs';

// Mock child_process
vi.mock('child_process', () => ({
  spawn: vi.fn()
}));

// Mock fs
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn()
}));

// Mock config
vi.mock('../src/utils/config.js', () => ({
  loadConfig: vi.fn(() => ({
    arduinoConfigFile: './arduino-cli.yaml',
    fqbn: 'rp2040:rp2040:seeed_xiao_rp2040',
    serialPort: 'COM3'
  })),
  getSerialPort: vi.fn(() => 'COM3')
}));

describe('ArduinoCLI - Arduino CLI wrapper for XIAO RP2040 board management', () => {
  let arduino;
  let mockProcess;

  beforeEach(() => {
    arduino = new ArduinoCLI();
    
    // Setup mock process
    mockProcess = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
      kill: vi.fn()
    };
    
    vi.mocked(spawn).mockReturnValue(mockProcess);
    vi.clearAllMocks();
  });

  describe('execute() - Low-level command execution', () => {
    it('should pass configuration file and arguments to arduino-cli and return stdout on success', async () => {
      const promise = arduino.execute(['version']);
      
      // Simulate successful execution
      const closeCallback = mockProcess.on.mock.calls.find(call => call[0] === 'close')[1];
      closeCallback(0);
      
      await expect(promise).resolves.toBeDefined();
      expect(spawn).toHaveBeenCalledWith(
        'arduino-cli',
        expect.arrayContaining(['--config-file', 'version']),
        expect.objectContaining({
          cwd: expect.any(String),
          shell: true
        })
      );
    });

    it('should throw an error with stderr content when arduino-cli returns non-zero exit code', async () => {
      const promise = arduino.execute(['invalid']);
      
      // Simulate error
      const stderrCallback = mockProcess.stderr.on.mock.calls[0][1];
      stderrCallback(Buffer.from('Error message'));
      
      const closeCallback = mockProcess.on.mock.calls.find(call => call[0] === 'close')[1];
      closeCallback(1);
      
      await expect(promise).rejects.toThrow('Command failed');
    });
  });

  describe('compile() - Sketch compilation for XIAO RP2040', () => {
    it('should compile sketch with correct FQBN (Fully Qualified Board Name) and output to build directory', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      
      const promise = compile('TestSketch');
      
      // Get stdout callback and send data
      const stdoutCallback = mockProcess.stdout.on.mock.calls[0][1];
      stdoutCallback(Buffer.from('Compilation output'));
      
      // Simulate successful completion
      const closeCallback = mockProcess.on.mock.calls.find(call => call[0] === 'close')[1];
      closeCallback(0);
      
      await promise;
      
      expect(spawn).toHaveBeenCalledWith(
        'arduino-cli',
        expect.arrayContaining(['compile', '--fqbn', 'rp2040:rp2040:seeed_xiao_rp2040']),
        expect.any(Object)
      );
    });

    it('should validate sketch directory exists before attempting compilation', async () => {
      vi.mocked(existsSync).mockReturnValue(false);
      
      await expect(compile('NonExistent')).rejects.toThrow('Sketch directory');
    });
  });

  describe('upload() - Deploy compiled sketches to XIAO RP2040 board', () => {
    it('should upload compiled sketch to specified serial port (e.g., COM5)', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      
      const promise = deploy('TestSketch', { port: 'COM5' });
      
      // Get stdout callback and send data
      setTimeout(() => {
        const stdoutCallback = mockProcess.stdout.on.mock.calls[0]?.[1];
        if (stdoutCallback) stdoutCallback(Buffer.from('Upload output'));
        const closeCallback = mockProcess.on.mock.calls.find(call => call[0] === 'close')[1];
        if (closeCallback) closeCallback(0);
      }, 10);
      
      await promise;
      
      expect(spawn).toHaveBeenCalledWith(
        'arduino-cli',
        expect.arrayContaining(['upload', '--port', 'COM5', '--fqbn', 'rp2040:rp2040:seeed_xiao_rp2040']),
        expect.any(Object)
      );
    });

    it('should fall back to default serial port (COM3) from config when no port specified', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      
      const promise = deploy('TestSketch', {});
      
      // Get stdout callback and send data
      setTimeout(() => {
        const stdoutCallback = mockProcess.stdout.on.mock.calls[0]?.[1];
        if (stdoutCallback) stdoutCallback(Buffer.from('Upload output'));
        const closeCallback = mockProcess.on.mock.calls.find(call => call[0] === 'close')[1];
        if (closeCallback) closeCallback(0);
      }, 10);
      
      await promise;
      
      expect(spawn).toHaveBeenCalledWith(
        'arduino-cli',
        expect.arrayContaining(['upload', '--port', 'COM3', '--fqbn', 'rp2040:rp2040:seeed_xiao_rp2040']),
        expect.any(Object)
      );
    });
  });

  describe('install() - Setup Arduino environment for XIAO RP2040 development', () => {
    it('should execute three sequential commands with arduino-cli.yaml config (ensures .arduino directory usage)', async () => {
      let callCount = 0;
      
      // Mock multiple sequential calls
      vi.mocked(spawn).mockImplementation(() => {
        callCount++;
        const proc = {
          stdout: { on: vi.fn() },
          stderr: { on: vi.fn() },
          on: vi.fn(),
          kill: vi.fn()
        };
        
        // Immediately resolve each command
        setTimeout(() => {
          const stdoutCallback = proc.stdout.on.mock.calls[0]?.[1];
          if (stdoutCallback) stdoutCallback(Buffer.from(`Output ${callCount}`));
          
          const closeCallback = proc.on.mock.calls.find(call => call[0] === 'close')?.[1];
          if (closeCallback) closeCallback(0);
        }, 0);
        
        return proc;
      });
      
      await install();
      
      // Check all three commands were called
      expect(spawn).toHaveBeenCalledTimes(3);
      
      // Check update-index was called with config file (ensures .arduino dir usage)
      expect(spawn).toHaveBeenNthCalledWith(
        1,
        'arduino-cli',
        expect.arrayContaining(['--config-file', 'core', 'update-index']),
        expect.any(Object)
      );
      
      // Check core install was called with config file (ensures .arduino dir usage)
      expect(spawn).toHaveBeenNthCalledWith(
        2,
        'arduino-cli',
        expect.arrayContaining(['--config-file', 'core', 'install', 'rp2040:rp2040']),
        expect.any(Object)
      );
      
      // Check library install was called with config file (ensures .arduino dir usage)
      expect(spawn).toHaveBeenNthCalledWith(
        3,
        'arduino-cli',
        expect.arrayContaining(['--config-file', 'lib', 'install', '"Adafruit NeoPixel"']),
        expect.any(Object)
      );
    });
  });
});