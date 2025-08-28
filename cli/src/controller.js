import { SerialPort } from 'serialport';
import { getSerialPort } from './utils/config.js';

/**
 * Color definitions
 */
const COLORS = {
  red: '255,0,0',
  green: '0,255,0',
  blue: '0,0,255',
  yellow: '255,255,0',
  purple: '255,0,255',
  cyan: '0,255,255',
  white: '255,255,255'
};

/**
 * LED Controller class for XIAO RP2040
 */
export class LedController {
  constructor(port, options = {}) {
    this.portName = port || getSerialPort();
    this.baudRate = options.baudRate || 9600;
    this.serialPort = null;
  }

  /**
   * Open serial connection
   */
  async connect() {
    return new Promise((resolve, reject) => {
      this.serialPort = new SerialPort({
        path: this.portName,
        baudRate: this.baudRate
      }, (err) => {
        if (err) {
          reject(new Error(`Failed to open port ${this.portName}: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Send command to the device
   * @param {string} command - Command to send
   */
  async sendCommand(command) {
    if (!this.serialPort || !this.serialPort.isOpen) {
      throw new Error('Serial port is not open. Call connect() first.');
    }

    return new Promise((resolve, reject) => {
      this.serialPort.write(`${command}\n`, (err) => {
        if (err) {
          reject(new Error(`Failed to send command: ${err.message}`));
        } else {
          console.log(`Sent command: ${command}`);
          resolve();
        }
      });
    });
  }

  /**
   * Close serial connection
   */
  async disconnect() {
    if (this.serialPort && this.serialPort.isOpen) {
      return new Promise((resolve) => {
        this.serialPort.close(() => {
          resolve();
        });
      });
    }
  }

  /**
   * Turn LED on (white)
   */
  async turnOn() {
    await this.sendCommand('ON');
  }

  /**
   * Turn LED off
   */
  async turnOff() {
    await this.sendCommand('OFF');
  }

  /**
   * Set solid color
   * @param {string} color - Color name or RGB string
   */
  async setColor(color) {
    const rgb = this.parseColor(color);
    await this.sendCommand(`COLOR,${rgb}`);
  }

  /**
   * Start blinking
   * @param {string} color - Color name or RGB string
   * @param {number} interval - Blink interval in milliseconds
   */
  async blink(color, interval = 500) {
    const rgb = this.parseColor(color);
    await this.sendCommand(`BLINK1,${rgb},${interval}`);
  }

  /**
   * Start two-color blinking
   * @param {string} color1 - First color
   * @param {string} color2 - Second color
   * @param {number} interval - Blink interval in milliseconds
   */
  async blink2Colors(color1, color2, interval = 500) {
    const rgb1 = this.parseColor(color1);
    const rgb2 = this.parseColor(color2);
    await this.sendCommand(`BLINK2,${rgb1},${rgb2},${interval}`);
  }

  /**
   * Start rainbow effect
   * @param {number} interval - Rainbow speed in milliseconds
   */
  async rainbow(interval = 50) {
    await this.sendCommand(`RAINBOW,${interval}`);
  }

  /**
   * Parse color input to RGB string
   * @param {string} color - Color name or RGB string
   * @returns {string} RGB string
   */
  parseColor(color) {
    // Check if it's a predefined color
    const lowerColor = color.toLowerCase();
    if (COLORS[lowerColor]) {
      return COLORS[lowerColor];
    }
    
    // Check if it's already an RGB string
    if (/^\d{1,3},\d{1,3},\d{1,3}$/.test(color)) {
      return color;
    }
    
    throw new Error(`Invalid color: ${color}. Use a color name (red, green, blue, etc.) or RGB format (255,0,0)`);
  }
}

/**
 * Execute a single command
 * @param {Object} options - Command options
 */
export async function executeCommand(options) {
  const controller = new LedController(options.port);
  
  try {
    await controller.connect();
    
    if (options.on) {
      await controller.turnOn();
    } else if (options.off) {
      await controller.turnOff();
    } else if (options.color) {
      if (options.blink) {
        if (options.secondColor) {
          await controller.blink2Colors(
            options.color,
            options.secondColor,
            options.interval
          );
        } else {
          await controller.blink(options.color, options.interval);
        }
      } else {
        await controller.setColor(options.color);
      }
    } else if (options.rainbow) {
      await controller.rainbow(options.interval);
    } else {
      throw new Error('No action specified. Use --on, --off, --color, or --rainbow');
    }
  } finally {
    await controller.disconnect();
  }
}