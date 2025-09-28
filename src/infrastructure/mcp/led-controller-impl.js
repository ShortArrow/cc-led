import { ILedController } from '../../interfaces/led-controller.interface.js';
import { LedController } from '../../controller.js';

/**
 * LED Controller implementation for MCP server
 * Bridges ILedController interface with concrete LedController implementation
 */
export class LedControllerImpl extends ILedController {
  #controllers = new Map(); // ledNumber -> LedController instance
  #mappings = new Map(); // ledNumber -> port mapping

  constructor() {
    super();
  }

  async controlLed(ledNumber, action, options = {}) {
    const controller = await this.#getControllerForLed(ledNumber);
    
    switch (action) {
      case 'on':
        if (options.color) {
          await controller.setColor(options.color);
        } else {
          await controller.turnOn();
        }
        break;
      case 'off':
        await controller.turnOff();
        break;
      case 'blink':
        if (options.secondColor) {
          await controller.blink2Colors(
            options.color || 'white',
            options.secondColor,
            options.interval || 500
          );
        } else {
          await controller.blink(options.color || 'white', options.interval || 500);
        }
        break;
      case 'rainbow':
        await controller.rainbow(options.interval || 50);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return {
      ledNumber,
      action,
      status: 'success',
      timestamp: new Date().toISOString()
    };
  }

  async getLedStatus(ledNumber) {
    // For now, return basic status - would need state tracking for full implementation
    const port = this.#mappings.get(ledNumber);
    if (!port) {
      throw new Error(`LED ${ledNumber} is not configured`);
    }

    return {
      ledNumber,
      state: {
        status: 'unknown', // Would need state tracking for actual status
        color: null,
        brightness: 100
      },
      port
    };
  }

  async listAvailableLeds() {
    const leds = [];
    for (const [ledNumber, port] of this.#mappings) {
      leds.push({
        ledNumber,
        name: `LED ${ledNumber}`,
        port,
        state: {
          status: 'unknown',
          color: null,
          brightness: 100
        }
      });
    }
    return leds;
  }

  async initializeLed(ledNumber, port, name) {
    this.#mappings.set(ledNumber, port);
    return {
      ledNumber,
      port,
      name,
      initialized: true
    };
  }

  async isLedAvailable(ledNumber) {
    return this.#mappings.has(ledNumber);
  }

  async getHardwareVersion() {
    // Use any available LED controller to get hardware version
    // Since VERSION is a global command, any connected port should work
    const ports = Array.from(this.#mappings.values());
    if (ports.length === 0) {
      throw new Error('No LEDs configured');
    }

    // Try each port until we get a response
    for (const port of ports) {
      try {
        const controller = new LedController(port);
        await controller.connect();
        const version = await controller.getVersion();
        await controller.disconnect();
        return version;
      } catch (error) {
        // Try next port
        continue;
      }
    }

    throw new Error('Unable to get hardware version from any configured LED');
  }

  async #getControllerForLed(ledNumber) {
    const port = this.#mappings.get(ledNumber);
    if (!port) {
      throw new Error(`LED ${ledNumber} is not configured`);
    }

    // Reuse existing controller or create new one
    if (!this.#controllers.has(ledNumber)) {
      const controller = new LedController(port);
      await controller.connect();
      this.#controllers.set(ledNumber, controller);
    }

    return this.#controllers.get(ledNumber);
  }

  async disconnect() {
    for (const controller of this.#controllers.values()) {
      await controller.disconnect();
    }
    this.#controllers.clear();
  }
}