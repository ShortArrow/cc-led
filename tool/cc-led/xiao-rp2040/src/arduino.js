import { spawn } from 'child_process';
import { existsSync } from 'fs';
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
    this.configFile = options.configFile || config.arduinoConfigFile;
    this.fqbn = options.fqbn || config.fqbn;
    // Find project root by looking for arduino-cli.yaml
    this.projectRoot = this.findProjectRoot();
  }

  /**
   * Find the project root directory
   * @returns {string} Project root path
   */
  findProjectRoot() {
    const possibleRoots = [
      process.cwd(),  // Current working directory
      join(__dirname, '..', '..', '..', '..'),  // Four levels up from src/
      join(process.cwd(), '..', '..', '..', '..')  // Four levels up from cwd
    ];

    for (const root of possibleRoots) {
      if (existsSync(join(root, 'arduino-cli.yaml'))) {
        return root;
      }
    }

    // Default to current directory if arduino-cli.yaml not found
    return process.cwd();
  }

  /**
   * Execute arduino-cli command
   * @param {string[]} args - Command arguments
   * @returns {Promise<string>} Command output
   */
  async execute(args) {
    return new Promise((resolve, reject) => {
      const fullArgs = ['--config-file', this.configFile, ...args];
      const proc = spawn('arduino-cli', fullArgs, {
        cwd: this.projectRoot,
        shell: true
      });

      let output = '';
      let error = '';

      proc.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log(text);
      });

      proc.stderr.on('data', (data) => {
        const text = data.toString();
        error += text;
        console.error(text);
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
   * Compile a sketch
   * @param {string} sketchName - Name of the sketch directory
   * @returns {Promise<void>}
   */
  async compile(sketchName) {
    const sketchDir = join(this.projectRoot, sketchName);
    
    if (!existsSync(sketchDir)) {
      throw new Error(`Sketch directory '${sketchDir}' not found`);
    }

    console.log(`Compiling sketch '${sketchName}' for board '${this.fqbn}'...`);
    
    await this.execute(['compile', '--fqbn', this.fqbn, sketchDir]);
    
    console.log(`Compilation successful. Output files are in '${sketchDir}/build'`);
  }

  /**
   * Upload a sketch to the board
   * @param {string} sketchName - Name of the sketch directory
   * @param {string} port - Serial port
   * @returns {Promise<void>}
   */
  async upload(sketchName, port) {
    const sketchDir = join(this.projectRoot, sketchName);
    const serialPort = port || getSerialPort();
    
    if (!existsSync(sketchDir)) {
      throw new Error(`Sketch directory '${sketchDir}' not found`);
    }

    console.log(`Uploading sketch '${sketchName}' to board '${this.fqbn}' on port '${serialPort}'...`);
    
    await this.execute([
      'upload',
      '--port', serialPort,
      '--fqbn', this.fqbn,
      sketchDir
    ]);
    
    console.log('Upload successful');
  }

  /**
   * Install board cores and libraries
   * @returns {Promise<void>}
   */
  async install() {
    console.log('Updating package index...');
    await this.execute(['core', 'update-index']);
    
    console.log('Installing Seeed RP2040 boards core...');
    await this.execute(['core', 'install', 'rp2040:rp2040']);
    
    console.log("Installing 'Adafruit NeoPixel' library...");
    await this.execute(['lib', 'install', '"Adafruit NeoPixel"']);
    
    console.log('Installation complete');
  }
}

/**
 * Compile a sketch
 * @param {string} sketchName - Name of the sketch
 * @param {Object} options - Options
 */
export async function compile(sketchName, options = {}) {
  const arduino = new ArduinoCLI(options);
  await arduino.compile(sketchName);
}

/**
 * Deploy (upload) a sketch
 * @param {string} sketchName - Name of the sketch
 * @param {Object} options - Options including port
 */
export async function deploy(sketchName, options = {}) {
  const arduino = new ArduinoCLI(options);
  await arduino.upload(sketchName, options.port);
}

/**
 * Install required components
 * @param {Object} options - Options
 */
export async function install(options = {}) {
  const arduino = new ArduinoCLI(options);
  await arduino.install();
}