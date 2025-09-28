import { LedIdentifier } from '../../../domain/mcp/value-objects/led-identifier.vo.js';
import { LedState } from '../../../domain/mcp/value-objects/led-state.vo.js';

export class ControlLedUseCase {
  #ledController;
  #ledMapping;

  constructor(ledController, ledMapping) {
    this.#ledController = ledController;
    this.#ledMapping = ledMapping;
  }

  async execute({ ledNumber, action, color = null, brightness = null, interval = null, secondColor = null }) {
    this.#validateInput(ledNumber, action, color, brightness, interval, secondColor);

    const port = await this.#ledMapping.getPortForLed(ledNumber);
    if (!port) {
      throw new Error(`LED ${ledNumber} is not configured`);
    }

    const options = {};
    if (color) options.color = color;
    if (brightness !== null && brightness !== undefined) options.brightness = brightness;
    if (interval !== null && interval !== undefined) options.interval = interval;
    if (secondColor) options.secondColor = secondColor;

    const result = await this.#ledController.controlLed(ledNumber, action, options);
    
    return {
      success: true,
      ledNumber,
      action,
      ...options,
      ...result
    };
  }

  #validateInput(ledNumber, action, color, brightness, interval, secondColor) {
    const ledId = new LedIdentifier(ledNumber);
    
    const validActions = ['on', 'off', 'blink', 'rainbow'];
    if (!validActions.includes(action)) {
      throw new Error(`Invalid action: ${action}`);
    }

    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      throw new Error('Invalid color format. Please specify in #RRGGBB format');
    }

    if (secondColor && !/^#[0-9A-Fa-f]{6}$/.test(secondColor)) {
      throw new Error('Invalid second color format. Please specify in #RRGGBB format');
    }

    if (brightness !== null && brightness !== undefined) {
      if (brightness < 0 || brightness > 100) {
        throw new Error('Brightness must be in the range 0 to 100');
      }
    }

    if (interval !== null && interval !== undefined) {
      if (interval < 50 || interval > 5000) {
        throw new Error('Blink interval must be in the range 50 to 5000 milliseconds');
      }
    }

    if (secondColor && action !== 'blink') {
      throw new Error('Second color can only be used with blink action');
    }
  }
}