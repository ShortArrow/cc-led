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
 * LED Controller class for Arduino boards
 */
export class LedController {
  constructor(port, options = {}) {
    this.portName = port || getSerialPort();
    this.baudRate = options.baudRate || 9600;
    this.serialPort = null;
    this.board = options.board;
    this.protocol = this.board ? this.board.getLedProtocol() : 'WS2812';
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
      console.log(`Sent command: ${command}`);
      
      // Set up response listener
      let responseReceived = false;
      const responseTimeout = setTimeout(() => {
        if (!responseReceived) {
          console.log('No response received from device (timeout)');
          resolve();
        }
      }, process.env.NODE_ENV === 'test' ? 10 : 2000);
      
      const responseHandler = (data) => {
        const response = data.toString().trim();
        if (response.startsWith('ACCEPTED,') || response.startsWith('REJECT,')) {
          responseReceived = true;
          clearTimeout(responseTimeout);
          console.log(`Device response: ${response}`);
          this.serialPort.off('data', responseHandler);
          resolve();
        }
      };
      
      this.serialPort.on('data', responseHandler);
      
      this.serialPort.write(`${command}\n`, (err) => {
        if (err) {
          clearTimeout(responseTimeout);
          this.serialPort.off('data', responseHandler);
          reject(new Error(`Failed to send command: ${err.message}`));
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
   * Turn LED on (white or default color)
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
    if (this.protocol === 'Digital' && color !== 'white') {
      console.log(`Note: Digital LED does not support colors. Color '${color}' ignored, turning LED on.`);
    }
    await this.sendCommand(`COLOR,${rgb}`);
  }

  /**
   * Start blinking
   * @param {string} color - Color name or RGB string
   * @param {number} interval - Blink interval in milliseconds
   */
  async blink(color, interval = 500) {
    const rgb = this.parseColor(color);
    if (this.protocol === 'Digital' && color && color !== 'white') {
      console.log(`Note: Digital LED does not support colors. Color '${color}' ignored, blinking LED.`);
    }
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
    if (this.protocol === 'Digital') {
      console.log(`Note: Digital LED does not support multi-color blinking. Colors '${color1}' and '${color2}' ignored, using single-color blink.`);
    }
    await this.sendCommand(`BLINK2,${rgb1},${rgb2},${interval}`);
  }

  /**
   * Start rainbow effect
   * @param {number} interval - Rainbow speed in milliseconds
   */
  async rainbow(interval = 50) {
    if (this.protocol === 'Digital') {
      console.log('Note: Digital LED does not support rainbow effect. Using simple blink instead.');
    }
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
    
    // Check if it's a potential RGB string (allowing negative and decimal numbers)
    if (/^-?\d*\.?\d+,-?\d*\.?\d+,-?\d*\.?\d+$/.test(color)) {
      const [r, g, b] = color.split(',').map(Number);
      const inRange = (n) => Number.isInteger(n) && n >= 0 && n <= 255;
      if (inRange(r) && inRange(g) && inRange(b)) {
        return `${r},${g},${b}`;
      }
      throw new Error(`Invalid color: ${color}. RGB values must be between 0 and 255`);
    }
    
    throw new Error(`Invalid color: ${color}. Use a color name (red, green, blue, etc.) or RGB format (255,0,0)`);
  }
}

/**
 * Execute a single command
 * @param {Object} options - Command options
 */
export async function executeCommand(options) {
  const controller = new LedController(options.port, {
    board: options.board,
    baudRate: options.board ? options.board.config.serial?.baudRate : 9600
  });
  
  try {
    await controller.connect();
    
    if (options.on) {
      await controller.turnOn();
    } else if (options.off) {
      await controller.turnOff();
    } else if (options.blink) {
      // Handle blink with optional color (default to white)
      const blinkColor = typeof options.blink === 'string' ? options.blink : (options.color || 'white');
      if (options.secondColor) {
        await controller.blink2Colors(
          blinkColor,
          options.secondColor,
          options.interval
        );
      } else {
        await controller.blink(blinkColor, options.interval);
      }
    } else if (options.color) {
      await controller.setColor(options.color);
    } else if (options.rainbow) {
      await controller.rainbow(options.interval);
    } else {
      throw new Error('No action specified. Use --on, --off, --color, --blink, or --rainbow');
    }
  } finally {
    await controller.disconnect();
  }
}
