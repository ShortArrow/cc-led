import { LedIdentifier } from '../value-objects/led-identifier.vo.js';
import { LedState } from '../value-objects/led-state.vo.js';

export class LedDevice {
  #identifier;
  #name;
  #port;
  #state;

  constructor(identifier, name, port) {
    if (!(identifier instanceof LedIdentifier)) {
      throw new Error('Valid LedIdentifier instance is required');
    }
    if (!name || name.trim() === '') {
      throw new Error('LED name is required');
    }
    if (!port || port.trim() === '') {
      throw new Error('Port information is required');
    }

    this.#identifier = identifier;
    this.#name = name;
    this.#port = port;
    this.#state = new LedState('off');
  }

  get identifier() {
    return this.#identifier;
  }

  get name() {
    return this.#name;
  }

  get port() {
    return this.#port;
  }

  get state() {
    return this.#state;
  }

  turnOn(color = null, brightness = null) {
    this.#state = new LedState('on', color, brightness);
  }

  turnOff() {
    this.#state = new LedState('off');
  }

  blink(color = null, brightness = null) {
    this.#state = new LedState('blink', color, brightness);
  }

  setState(state) {
    if (!(state instanceof LedState)) {
      throw new Error('Valid LedState instance is required');
    }
    this.#state = state;
  }

  toJSON() {
    return {
      ledNumber: this.#identifier.value,
      name: this.#name,
      state: this.#state.toJSON()
    };
  }
}