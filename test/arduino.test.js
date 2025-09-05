/**
 * @fileoverview Arduino CLI wrapper tests
 * 
 * These tests verify the Arduino CLI integration for compiling, uploading,
 * and managing Arduino sketches for the XIAO RP2040 board.
 * All tests use mocked child_process.spawn to avoid actual Arduino CLI calls.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
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
  beforeEach(() => {
    vi.clearAllMocks();
    // Don't reset modules to maintain consistent mocking
  });

  describe('execute() - Low-level command execution', () => {
    it('A1-001: should pass configuration file and arguments to arduino-cli and return stdout on success', async () => {
      
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setImmediate(() => callback(0));
          }
        }),
        kill: vi.fn()
      };
      
      vi.mocked(spawn).mockReturnValue(mockProcess);
      
      const arduino = new ArduinoCLI();
      await arduino.execute(['version']);
      
      expect(spawn).toHaveBeenCalledWith(
        'arduino-cli',
        expect.arrayContaining(['--log', '--log-level', 'info', '--config-file', 'version']),
        expect.objectContaining({
          cwd: expect.any(String),
          shell: true
        })
      );
    });

    it('A1-002: should include log level parameter when provided', async () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setImmediate(() => callback(0));
          }
        }),
        kill: vi.fn()
      };
      
      vi.mocked(spawn).mockReturnValue(mockProcess);
      
      const arduino = new ArduinoCLI();
      await arduino.execute(['version'], 'debug');
      
      expect(spawn).toHaveBeenCalledWith(
        'arduino-cli',
        expect.arrayContaining(['--log', '--log-level', 'debug', 'version']),
        expect.any(Object)
      );
    });

    it('A1-003: should default to info log level when no level specified', async () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setImmediate(() => callback(0));
          }
        }),
        kill: vi.fn()
      };
      
      vi.mocked(spawn).mockReturnValue(mockProcess);
      
      const arduino = new ArduinoCLI();
      await arduino.execute(['version']);
      
      expect(spawn).toHaveBeenCalledWith(
        'arduino-cli',
        expect.arrayContaining(['--log', '--log-level', 'info', 'version']),
        expect.any(Object)
      );
    });

    it('A1-004: should throw an error with stderr content when arduino-cli returns non-zero exit code', async () => {
      
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn((event, callback) => {
          if (event === 'data') {
            setImmediate(() => callback(Buffer.from('Error message')));
          }
        })},
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setImmediate(() => callback(1));
          }
        }),
        kill: vi.fn()
      };
      
      vi.mocked(spawn).mockReturnValue(mockProcess);
      
      const arduino = new ArduinoCLI();
      await expect(arduino.execute(['invalid'])).rejects.toThrow('Command failed');
    });
  });

  describe('compile() - Sketch compilation for XIAO RP2040', () => {
    it('A1-005: should compile sketch with correct FQBN (Fully Qualified Board Name) and output to build directory', async () => {
      const { compile } = await import('../src/arduino.js');
      
      vi.mocked(existsSync).mockReturnValue(true);
      
      const mockProcess = {
        stdout: { on: vi.fn((event, callback) => {
          if (event === 'data') {
            setImmediate(() => callback(Buffer.from('Compilation output')));
          }
        })},
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setImmediate(() => callback(0));
          }
        }),
        kill: vi.fn()
      };
      
      vi.mocked(spawn).mockReturnValue(mockProcess);
      
      await compile('TestSketch');
      
      expect(spawn).toHaveBeenCalledWith(
        'arduino-cli',
        expect.arrayContaining(['compile', '--fqbn', 'rp2040:rp2040:seeed_xiao_rp2040']),
        expect.any(Object)
      );
    });

    it('A1-006: should validate sketch directory exists before attempting compilation', async () => {
      const { compile } = await import('../src/arduino.js');
      
      vi.mocked(existsSync).mockReturnValue(false);
      
      await expect(compile('NonExistent')).rejects.toThrow('Sketch directory');
    });
  });

  describe('upload() - Deploy compiled sketches to XIAO RP2040 board', () => {
    it('A1-007: should upload compiled sketch to specified serial port (e.g., COM5)', async () => {
      const { deploy } = await import('../src/arduino.js');
      
      vi.mocked(existsSync).mockReturnValue(true);
      
      const mockProcess = {
        stdout: { on: vi.fn((event, callback) => {
          if (event === 'data') {
            setImmediate(() => callback(Buffer.from('Upload output')));
          }
        })},
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setImmediate(() => callback(0));
          }
        }),
        kill: vi.fn()
      };
      
      vi.mocked(spawn).mockReturnValue(mockProcess);
      
      await deploy('TestSketch', { port: 'COM5' });
      
      expect(spawn).toHaveBeenCalledWith(
        'arduino-cli',
        expect.arrayContaining(['upload', '--port', 'COM5', '--fqbn', 'rp2040:rp2040:seeed_xiao_rp2040']),
        expect.any(Object)
      );
    });

    it('A1-008: should fall back to default serial port (COM3) from config when no port specified', async () => {
      const { deploy } = await import('../src/arduino.js');
      
      vi.mocked(existsSync).mockReturnValue(true);
      
      const mockProcess = {
        stdout: { on: vi.fn((event, callback) => {
          if (event === 'data') {
            setImmediate(() => callback(Buffer.from('Upload output')));
          }
        })},
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setImmediate(() => callback(0));
          }
        }),
        kill: vi.fn()
      };
      
      vi.mocked(spawn).mockReturnValue(mockProcess);
      
      await deploy('TestSketch', {});
      
      expect(spawn).toHaveBeenCalledWith(
        'arduino-cli',
        expect.arrayContaining(['upload', '--port', 'COM3', '--fqbn', 'rp2040:rp2040:seeed_xiao_rp2040']),
        expect.any(Object)
      );
    });
  });

  describe('install() - Setup Arduino environment for XIAO RP2040 development', () => {
    it('A1-009: should execute three sequential commands with arduino-cli.yaml config (ensures .arduino directory usage)', async () => {
      const { install } = await import('../src/arduino.js');
      
      let callCount = 0;
      
      // Mock multiple sequential calls with immediate resolution
      vi.mocked(spawn).mockImplementation(() => {
        callCount++;
        const proc = {
          stdout: { on: vi.fn((event, callback) => {
            if (event === 'data') {
              setImmediate(() => callback(Buffer.from(`Output ${callCount}`)));
            }
          })},
          stderr: { on: vi.fn() },
          on: vi.fn((event, callback) => {
            if (event === 'close') {
              setImmediate(() => callback(0));
            }
          }),
          kill: vi.fn()
        };
        
        return proc;
      });
      
      await install();
      
      // Check all three commands were called
      expect(spawn).toHaveBeenCalledTimes(3);
      
      // Check update-index was called with config file (ensures .arduino dir usage)
      expect(spawn).toHaveBeenNthCalledWith(
        1,
        'arduino-cli',
        ['--log', '--log-level', 'info', '--config-file', expect.any(String), 'core', 'update-index'],
        expect.any(Object)
      );
      
      // Check core install was called with config file (ensures .arduino dir usage)
      expect(spawn).toHaveBeenNthCalledWith(
        2,
        'arduino-cli',
        ['--log', '--log-level', 'info', '--config-file', expect.any(String), 'core', 'install', 'rp2040:rp2040'],
        expect.any(Object)
      );
      
      // Check library install was called with config file (ensures .arduino dir usage)
      expect(spawn).toHaveBeenNthCalledWith(
        3,
        'arduino-cli',
        ['--log', '--log-level', 'info', '--config-file', expect.any(String), 'lib', 'install', '"Adafruit NeoPixel"'],
        expect.any(Object)
      );
    });

    it('A1-010: should use board-specific platform and libraries when board provided', async () => {
      const { install } = await import('../src/arduino.js');
      
      const mockBoard = {
        name: 'Test Board',
        platform: { package: 'test:platform' },
        libraries: [
          { name: 'TestLib1', version: '1.0.0' },
          { name: 'TestLib2' }
        ]
      };
      
      let callCount = 0;
      vi.mocked(spawn).mockImplementation(() => {
        callCount++;
        const proc = {
          stdout: { on: vi.fn((event, callback) => {
            if (event === 'data') {
              setImmediate(() => callback(Buffer.from(`Output ${callCount}`)));
            }
          })},
          stderr: { on: vi.fn() },
          on: vi.fn((event, callback) => {
            if (event === 'close') {
              setImmediate(() => callback(0));
            }
          }),
          kill: vi.fn()
        };
        
        return proc;
      });
      
      await install({ board: mockBoard });
      
      expect(spawn).toHaveBeenCalledTimes(4); // update-index + core + 2 libraries
      
      // Check board-specific platform installation
      expect(spawn).toHaveBeenNthCalledWith(
        2,
        'arduino-cli',
        ['--log', '--log-level', 'info', '--config-file', expect.any(String), 'core', 'install', 'test:platform'],
        expect.any(Object)
      );
      
      // Check library with version
      expect(spawn).toHaveBeenNthCalledWith(
        3,
        'arduino-cli',
        ['--log', '--log-level', 'info', '--config-file', expect.any(String), 'lib', 'install', '"TestLib1@1.0.0"'],
        expect.any(Object)
      );
      
      // Check library without version
      expect(spawn).toHaveBeenNthCalledWith(
        4,
        'arduino-cli',
        ['--log', '--log-level', 'info', '--config-file', expect.any(String), 'lib', 'install', '"TestLib2"'],
        expect.any(Object)
      );
    });

    it('A1-011: should fall back to legacy installation when no board provided', async () => {
      const { install } = await import('../src/arduino.js');
      
      let callCount = 0;
      vi.mocked(spawn).mockImplementation(() => {
        callCount++;
        const proc = {
          stdout: { on: vi.fn((event, callback) => {
            if (event === 'data') {
              setImmediate(() => callback(Buffer.from(`Output ${callCount}`)));
            }
          })},
          stderr: { on: vi.fn() },
          on: vi.fn((event, callback) => {
            if (event === 'close') {
              setImmediate(() => callback(0));
            }
          }),
          kill: vi.fn()
        };
        
        return proc;
      });
      
      await install({ board: null });
      
      expect(spawn).toHaveBeenCalledTimes(3);
      
      // Should use legacy XIAO RP2040 commands
      expect(spawn).toHaveBeenNthCalledWith(
        2,
        'arduino-cli',
        ['--log', '--log-level', 'info', '--config-file', expect.any(String), 'core', 'install', 'rp2040:rp2040'],
        expect.any(Object)
      );
      
      expect(spawn).toHaveBeenNthCalledWith(
        3,
        'arduino-cli',
        ['--log', '--log-level', 'info', '--config-file', expect.any(String), 'lib', 'install', '"Adafruit NeoPixel"'],
        expect.any(Object)
      );
    });

    it('A1-012: should pass log level to all installation commands', async () => {
      const { install } = await import('../src/arduino.js');
      
      let callCount = 0;
      vi.mocked(spawn).mockImplementation(() => {
        callCount++;
        const proc = {
          stdout: { on: vi.fn((event, callback) => {
            if (event === 'data') {
              setImmediate(() => callback(Buffer.from(`Output ${callCount}`)));
            }
          })},
          stderr: { on: vi.fn() },
          on: vi.fn((event, callback) => {
            if (event === 'close') {
              setImmediate(() => callback(0));
            }
          }),
          kill: vi.fn()
        };
        
        return proc;
      });
      
      await install({ logLevel: 'debug' });
      
      // Check all commands include debug log level
      expect(spawn).toHaveBeenNthCalledWith(
        1,
        'arduino-cli',
        ['--log', '--log-level', 'debug', '--config-file', expect.any(String), 'core', 'update-index'],
        expect.any(Object)
      );
      
      expect(spawn).toHaveBeenNthCalledWith(
        2,
        'arduino-cli',
        ['--log', '--log-level', 'debug', '--config-file', expect.any(String), 'core', 'install', 'rp2040:rp2040'],
        expect.any(Object)
      );
      
      expect(spawn).toHaveBeenNthCalledWith(
        3,
        'arduino-cli',
        ['--log', '--log-level', 'debug', '--config-file', expect.any(String), 'lib', 'install', '"Adafruit NeoPixel"'],
        expect.any(Object)
      );
    });
  });
});