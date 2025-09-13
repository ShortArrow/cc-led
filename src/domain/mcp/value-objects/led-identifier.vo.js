export class LedIdentifier {
  #value;

  constructor(value) {
    this.#validate(value);
    this.#value = value;
  }

  #validate(value) {
    if (!Number.isInteger(value) || value < 1) {
      throw new Error('LED number must be an integer of 1 or greater');
    }
    if (value > 100) {
      throw new Error('LED number must be in the range 1 to 100');
    }
  }

  get value() {
    return this.#value;
  }

  equals(other) {
    if (!(other instanceof LedIdentifier)) {
      return false;
    }
    return this.#value === other.value;
  }

  toString() {
    return `LED-${this.#value}`;
  }
}