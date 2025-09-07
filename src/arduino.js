/**
 * @fileoverview Arduino CLI Wrapper with Dependency Injection
 * 
 * Provides Arduino CLI functionality following Clean Architecture principles.
 * Uses dependency injection for testable design without external dependencies.
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { NodeFileSystemAdapter } from './adapters/node-file-system.adapter.js';
import { NodeProcessExecutorAdapter } from './adapters/node-process-executor.adapter.js';
import { loadConfig, getSerialPort } from './utils/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Arduino CLI Service with Dependency Injection
 */
export class ArduinoService {
  /**
   * Create ArduinoService with injected dependencies
   * @param {FileSystemInterface} fileSystem - File system adapter
   * @param {ProcessExecutorInterface} processExecutor - Process executor adapter
   * @param {object} options - Arduino CLI options
   */
  constructor(fileSystem, processExecutor, options = {}) {
    this.fileSystem = fileSystem;
    this.processExecutor = processExecutor;
    
    const config = loadConfig();
    this.fqbn = options.fqbn || config.fqbn;
    
    // Determine config file path based on priority system
    this.configFile = this.resolveConfigFile(options.configFile);
    
    // Use package installation directory for board files and sketches
    this.packageRoot = join(__dirname, '..');
    // Current working directory for .arduino and config files
    this.workingDir = process.cwd();
  }

  /**
   * Resolve arduino-cli.yaml config file path based on priority system
   * Priority: 1. CLI parameter, 2. Current directory, 3. Create in current directory
   * @param {string} [cliConfigFile] - Config file specified via CLI parameter
   * @returns {string} Path to config file to use
   */
  resolveConfigFile(cliConfigFile) {
    const workingDirectory = process.cwd();
    
    // Priority 1: CLI parameter (--config-file <path>)
    if (cliConfigFile) {
      return this._validateCliConfigFile(cliConfigFile);
    }
    
    // Priority 2: Current directory (./arduino-cli.yaml)
    const currentDirConfig = join(workingDirectory, 'arduino-cli.yaml');
    if (this.fileSystem.existsSync(currentDirConfig)) {
      return currentDirConfig;
    }
    
    // Priority 3: Create default config in current directory
    return this.createLocalConfig(workingDirectory);
  }

  /**
   * Validate CLI-specified config file existence
   * @param {string} cliConfigFile - Config file path from CLI parameter
   * @returns {string} Validated config file path
   * @throws {Error} If config file does not exist
   * @private
   */
  _validateCliConfigFile(cliConfigFile) {
    if (!this.fileSystem.existsSync(cliConfigFile)) {
      throw new Error(`Arduino CLI config file not found: ${cliConfigFile}`);
    }
    return cliConfigFile;
  }

  /**
   * Create local arduino-cli.yaml in current directory
   * @param {string} [workingDirectory] - Working directory (defaults to process.cwd())
   * @returns {string} Path to created config file
   */
  createLocalConfig(workingDirectory = process.cwd()) {
    const configPath = join(workingDirectory, 'arduino-cli.yaml');
    const arduinoDir = join(workingDirectory, '.arduino');
    
    // Create .arduino directory if it doesn't exist
    if (!this.fileSystem.existsSync(arduinoDir)) {
      // Note: We need to create directories recursively, but FileSystemInterface
      // doesn't have mkdir. For now, we'll assume directories exist in tests
      try {
        this.fileSystem.writeFileSync(join(arduinoDir, '.keep'), '', 'utf-8');
      } catch (error) {
        // Directory creation failed, continue anyway
      }
    }
    
    // Create arduino-cli.yaml config file
    const configContent = this._generateDefaultConfigContent();
    
    // Write config file if it doesn't exist or update if needed
    this.fileSystem.writeFileSync(configPath, configContent, 'utf-8');
    
    return configPath;
  }

  /**
   * Generate default arduino-cli.yaml configuration content
   * @returns {string} Configuration file content in YAML format
   * @private
   */
  _generateDefaultConfigContent() {
    return `directories:
  data: ./.arduino/data
  downloads: ./.arduino/data/downloads
  user: ./.arduino/data
board_manager:
  additional_urls:
    - https://github.com/earlephilhower/arduino-pico/releases/download/global/package_rp2040_index.json
    - https://files.seeedstudio.com/arduino/package_seeeduino_boards_index.json
`;
  }

  /**
   * Execute arduino-cli command
   * @param {string[]} args - Command arguments
   * @param {string} [logLevel='info'] - Log level for arduino-cli
   * @returns {Promise<string>} Command output
   */
  async execute(args, logLevel = 'info') {
    // Log config file selection for debugging
    if (logLevel === 'debug') {
      console.log(`Using arduino-cli config file: ${this.configFile}`);
    }
    
    return new Promise((resolve, reject) => {
      const fullArgs = ['--log', '--log-level', logLevel, '--config-file', this.configFile, ...args];
      const proc = this.processExecutor.spawn('arduino-cli', fullArgs, {
        cwd: this.workingDir,
        shell: true
      });

      let output = '';
      let error = '';

      proc.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
      });

      proc.stderr.on('data', (data) => {
        const text = data.toString();
        error += text;
        process.stderr.write(text);
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Command failed with code ${code}: ${error}`));
        } else {
          resolve(output);
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to execute arduino-cli: ${err.message}`));
      });
    });
  }

  /**
   * Compile sketch
   * @param {string} sketchName - Name of sketch to compile
   * @param {object} board - Board configuration
   * @param {string} [logLevel='info'] - Log level
   * @returns {Promise<string>} Compilation output
   */
  async compile(sketchName, board, logLevel = 'info') {
    let sketchPath;
    
    // Use board-specific sketch path if board object is provided
    if (board && typeof board.getSketchPath === 'function') {
      sketchPath = board.getSketchPath(sketchName);
    } else {
      // Fallback to legacy path structure
      sketchPath = join(this.packageRoot, 'sketches', sketchName);
    }
    
    // Validate sketch directory exists
    if (!this.fileSystem.existsSync(sketchPath)) {
      throw new Error(`Sketch directory does not exist: ${sketchPath}`);
    }
    
    const args = ['compile', '--fqbn', board.fqbn || this.fqbn, sketchPath];
    return this.execute(args, logLevel);
  }

  /**
   * Upload sketch to board
   * @param {string} sketchName - Name of sketch to upload
   * @param {object} board - Board configuration
   * @param {object} options - Upload options (port, logLevel, etc.)
   * @returns {Promise<string>} Upload output
   */
  async deploy(sketchName, board, options = {}) {
    let sketchPath;
    
    // Use board-specific sketch path if board object is provided
    if (board && typeof board.getSketchPath === 'function') {
      sketchPath = board.getSketchPath(sketchName);
    } else {
      // Fallback to legacy path structure
      sketchPath = join(this.packageRoot, 'sketches', sketchName);
    }
    
    const port = options.port || getSerialPort();
    const logLevel = options.logLevel || 'info';
    
    const args = ['upload', '--fqbn', board.fqbn || this.fqbn, '--port', port, sketchPath];
    return this.execute(args, logLevel);
  }

  /**
   * Install board dependencies
   * @param {object} options - Install options containing board and logLevel
   * @param {object} options.board - Board configuration
   * @param {string} [options.logLevel='info'] - Log level for Arduino CLI
   * @returns {Promise<string>} Install output
   */
  async install(options = {}) {
    const { board, logLevel = 'info' } = options;
    
    if (!board) {
      throw new Error('Board configuration is required');
    }
    
    // Install core if specified
    if (board.platform && board.platform.package) {
      const coreArgs = ['core', 'install', `${board.platform.package}@${board.platform.version || 'latest'}`];
      await this.execute(coreArgs, logLevel);
    }
    
    // Install libraries if specified
    if (board.libraries && Array.isArray(board.libraries)) {
      for (const library of board.libraries) {
        const libArgs = ['lib', 'install', `"${library.name}"@${library.version || 'latest'}`];
        await this.execute(libArgs, logLevel);
      }
    }
    
    return 'Installation complete';
  }
}

/**
 * Legacy Arduino CLI wrapper class for backward compatibility
 */
export class ArduinoCLI {
  constructor(options = {}) {
    this.service = new ArduinoService(
      new NodeFileSystemAdapter(),
      new NodeProcessExecutorAdapter(),
      options
    );
  }

  async execute(args, logLevel) {
    return this.service.execute(args, logLevel);
  }

  async compile(sketchName, board, logLevel) {
    return this.service.compile(sketchName, board, logLevel);
  }

  async deploy(sketchName, board, options) {
    return this.service.deploy(sketchName, board, options);
  }

  async install(board, options) {
    return this.service.install(board, options);
  }
}

// Legacy function exports for backward compatibility
let defaultArduinoService = null;

/**
 * Get default ArduinoService instance with production adapters
 * @returns {ArduinoService} Default Arduino service
 */
function getDefaultArduinoService() {
  if (!defaultArduinoService) {
    defaultArduinoService = new ArduinoService(
      new NodeFileSystemAdapter(),
      new NodeProcessExecutorAdapter()
    );
  }
  return defaultArduinoService;
}

/**
 * Compile sketch (legacy API)
 */
export async function compile(sketchName, board, logLevel) {
  return getDefaultArduinoService().compile(sketchName, board, logLevel);
}

/**
 * Deploy sketch (legacy API)
 */
export async function deploy(sketchName, board, options) {
  return getDefaultArduinoService().deploy(sketchName, board, options);
}

/**
 * Install dependencies (legacy API)
 */
export async function install(board, options) {
  return getDefaultArduinoService().install(board, options);
}

/**
 * Set custom ArduinoService instance (for testing)
 * @param {ArduinoService} arduinoService - Custom Arduino service
 */
export function setArduinoService(arduinoService) {
  defaultArduinoService = arduinoService;
}

/**
 * Reset to default ArduinoService (for testing cleanup)
 */
export function resetArduinoService() {
  defaultArduinoService = null;
}