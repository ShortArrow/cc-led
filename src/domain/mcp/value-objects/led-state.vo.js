export class LedState {
  #status;
  #color;
  #brightness;

  static VALID_STATUSES = ['on', 'off', 'blink'];
  static COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

  constructor(status, color = null, brightness = null) {
    this.#validateStatus(status);
    this.#status = status;
    
    if (color) {
      this.#validateColor(color);
      this.#color = color;
    } else {
      this.#color = null;
    }

    if (brightness !== null) {
      this.#validateBrightness(brightness);
      this.#brightness = brightness;
    } else {
      this.#brightness = status === 'off' ? 0 : 100;
    }
  }

  #validateStatus(status) {
    if (!LedState.VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid LED status: ${status}`);
    }
  }

  #validateColor(color) {
    if (!LedState.COLOR_PATTERN.test(color)) {
      throw new Error('Invalid color format. Please specify in #RRGGBB format');
    }
  }

  #validateBrightness(brightness) {
    if (brightness < 0 || brightness > 100) {
      throw new Error('Brightness must be in the range 0 to 100');
    }
  }

  get status() {
    return this.#status;
  }

  get color() {
    return this.#color;
  }

  get brightness() {
    return this.#brightness;
  }

  equals(other) {
    if (!(other instanceof LedState)) {
      return false;
    }
    return this.#status === other.status &&
           this.#color === other.color &&
           this.#brightness === other.brightness;
  }

  toJSON() {
    return {
      status: this.#status,
      color: this.#color,
      brightness: this.#brightness
    };
  }
}