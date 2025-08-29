import { spawn } from 'child_process';
import { existsSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadConfig, getSerialPort } from './utils/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Arduino CLI wrapper class
 */
export class ArduinoCLI {
  constructor(options = {}) {
    const config = loadConfig();
    this.fqbn = options.fqbn || config.fqbn;
    // Create local arduino-cli.yaml in current directory
    this.configFile = this.createLocalConfig();
    // Use package installation directory for board files and sketches
    this.packageRoot = join(__dirname, '..');
    // Current working directory for .arduino and config files
    this.workingDir = process.cwd();
  }

  /**
   * Create local arduino-cli.yaml in current directory
   * @returns {string} Path to created config file
   */
  createLocalConfig() {
    const cwd = process.cwd();
    const configPath = join(cwd, 'arduino-cli.yaml');
    const arduinoDir = join(cwd, '.arduino');
    
    // Create .arduino directory if it doesn't exist
    if (!existsSync(arduinoDir)) {
      mkdirSync(arduinoDir, { recursive: true });
      mkdirSync(join(arduinoDir, 'data'), { recursive: true });
      mkdirSync(join(arduinoDir, 'data', 'downloads'), { recursive: true });
    }
    
    // Create arduino-cli.yaml config file
    const configContent = `directories:
  data: ./.arduino/data
  downloads: ./.arduino/data/downloads
  user: ./.arduino/data
board_manager:
  additional_urls:
    - https://github.com/earlephilhower/arduino-pico/releases/download/global/package_rp2040_index.json
    - https://files.seeedstudio.com/arduino/package_seeeduino_boards_index.json
`;
    
    // Write config file if it doesn't exist or update if needed
    writeFileSync(configPath, configContent, 'utf-8');
    
    return configPath;
  }

  /**
   * Execute arduino-cli command
   * @param {string[]} args - Command arguments
   * @param {string} [logLevel='info'] - Log level for arduino-cli
   * @returns {Promise<string>} Command output
   */
  async execute(args, logLevel = 'info') {
    return new Promise((resolve, reject) => {
      const fullArgs = ['--log', '--log-level', logLevel, '--config-file', this.configFile, ...args];
      const proc = spawn('arduino-cli', fullArgs, {
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
   * Check if dependencies are installed
   * @returns {Promise<boolean>}
   */
  async checkDependencies() {
    try {
      // Check if board core is installed
      await this.execute(['core', 'list']);
      return true;
    } catch (error) {
      if (error.message.includes('platform not installed') || error.message.includes('not found')) {
        return false;
      }
      return true;
    }
  }

  /**
   * Check if sketch is compiled (build directory exists and contains compiled files)
   * @param {string} sketchDir - Sketch directory path
   * @returns {boolean}
   */
  isCompiled(sketchDir) {
    const buildDir = join(sketchDir, 'build');
    if (!existsSync(buildDir)) {
      return false;
    }
    
    // Check if build directory contains compiled files (.bin, .elf, or .uf2 files)
    try {
      const files = readdirSync(buildDir);
      return files.some(file => file.endsWith('.bin') || file.endsWith('.elf') || file.endsWith('.uf2'));
    } catch (error) {
      return false;
    }
  }

  /**
   * Compile a sketch
   * @param {string} sketchName - Name of the sketch directory
   * @param {Object} board - Board instance with sketch path info
   * @param {string} [logLevel='info'] - Arduino CLI log level
   * @returns {Promise<void>}
   */
  async compile(sketchName, board = null, logLevel = 'info') {
    let sketchDir;
    
    if (board && board.supportsSketch(sketchName)) {
      // Use board-specific sketch location
      const boardsDir = join(this.packageRoot, 'boards', board.id);
      const sketchPath = board.getSketchPath(sketchName);
      sketchDir = join(boardsDir, sketchPath);
    } else {
      // Legacy: try working directory
      sketchDir = join(this.workingDir, sketchName);
    }
    
    if (!existsSync(sketchDir)) {
      throw new Error(`Sketch directory '${sketchDir}' not found`);
    }

    console.log(`Compiling sketch '${sketchName}' for board '${this.fqbn}'...`);
    
    // Try to compile, and if dependencies are missing, install them automatically
    const buildDir = join(sketchDir, 'build');
    try {
      await this.execute(['compile', '--fqbn', this.fqbn, '--build-path', buildDir, sketchDir], logLevel);
    } catch (error) {
      if (error.message.includes('Platform') && error.message.includes('not found')) {
        console.log('Dependencies missing. Installing automatically...');
        await this.install(logLevel, board);
        console.log('Retrying compilation...');
        await this.execute(['compile', '--fqbn', this.fqbn, '--build-path', buildDir, sketchDir], logLevel);
      } else {
        throw error;
      }
    }
    
    console.log(`Compilation successful. Output files are in '${sketchDir}/build'`);
  }

  /**
   * Upload a sketch to the board
   * @param {string} sketchName - Name of the sketch directory
   * @param {string} port - Serial port
   * @param {Object} board - Board instance with sketch path info
   * @param {string} [logLevel='info'] - Arduino CLI log level
   * @returns {Promise<void>}
   */
  async upload(sketchName, port, board = null, logLevel = 'info') {
    let sketchDir;
    
    if (board && board.supportsSketch(sketchName)) {
      // Use board-specific sketch location
      const boardsDir = join(this.packageRoot, 'boards', board.id);
      const sketchPath = board.getSketchPath(sketchName);
      sketchDir = join(boardsDir, sketchPath);
    } else {
      // Legacy: try working directory
      sketchDir = join(this.workingDir, sketchName);
    }
    
    if (!existsSync(sketchDir)) {
      throw new Error(`Sketch directory '${sketchDir}' not found`);
    }

    // Auto-compile if not compiled
    if (!this.isCompiled(sketchDir)) {
      console.log('Sketch not compiled. Compiling automatically...');
      await this.compile(sketchName, board, logLevel);
    }
    
    const serialPort = port || getSerialPort();

    console.log(`Uploading sketch '${sketchName}' to board '${this.fqbn}' on port '${serialPort}'...`);
    
    try {
      await this.execute([
        'upload',
        '--port', serialPort,
        '--fqbn', this.fqbn,
        '--input-dir', join(sketchDir, 'build'),
        sketchDir
      ], logLevel);
    } catch (error) {
      if (error.message.includes('Platform') && error.message.includes('not found')) {
        console.log('Dependencies missing. Installing automatically...');
        await this.install(logLevel, board);
        console.log('Retrying upload...');
        await this.execute([
          'upload',
          '--port', serialPort,
          '--fqbn', this.fqbn,
          '--input-dir', join(sketchDir, 'build'),
          sketchDir
        ], logLevel);
      } else {
        throw error;
      }
    }
    
    console.log('Upload successful');
  }

  /**
   * Install board cores and libraries
   * @param {string} [logLevel='info'] - Arduino CLI log level
   * @param {Object} [board=null] - Board instance with platform and library info
   * @returns {Promise<void>}
   */
  async install(logLevel = 'info', board = null) {
    console.log('Updating package index...');
    await this.execute(['core', 'update-index'], logLevel);
    
    if (board) {
      // Use board-specific installation
      if (board.platform && board.platform.package) {
        console.log(`Installing ${board.name} boards core (${board.platform.package})...`);
        await this.execute(['core', 'install', board.platform.package], logLevel);
      }
      
      if (board.libraries && board.libraries.length > 0) {
        for (const lib of board.libraries) {
          const libName = lib.version ? `${lib.name}@${lib.version}` : lib.name;
          console.log(`Installing '${libName}' library...`);
          await this.execute(['lib', 'install', `"${libName}"`], logLevel);
        }
      }
    } else {
      // Legacy: fallback for XIAO RP2040
      console.log('Installing Seeed RP2040 boards core...');
      await this.execute(['core', 'install', 'rp2040:rp2040'], logLevel);
      
      console.log("Installing 'Adafruit NeoPixel' library...");
      await this.execute(['lib', 'install', '"Adafruit NeoPixel"'], logLevel);
    }
    
    console.log('Installation complete');
  }
}

/**
 * Compile a sketch
 * @param {string} sketchName - Name of the sketch
 * @param {Object} options - Options including board and logLevel
 */
export async function compile(sketchName, options = {}) {
  const arduino = new ArduinoCLI(options);
  await arduino.compile(sketchName, options.board, options.logLevel);
}

/**
 * Deploy (upload) a sketch
 * @param {string} sketchName - Name of the sketch
 * @param {Object} options - Options including port, board and logLevel
 */
export async function deploy(sketchName, options = {}) {
  const arduino = new ArduinoCLI(options);
  await arduino.upload(sketchName, options.port, options.board, options.logLevel);
}

/**
 * Install required components
 * @param {Object} options - Options including logLevel and board
 */
export async function install(options = {}) {
  const arduino = new ArduinoCLI(options);
  await arduino.install(options.logLevel, options.board);
}