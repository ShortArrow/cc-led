import { LedIdentifier } from '../../../domain/mcp/value-objects/led-identifier.vo.js';
import { ILedMapping } from '../../../interfaces/led-mapping.interface.js';

export class LedMappingService extends ILedMapping {
  #mappings;

  constructor() {
    super();
    this.#mappings = new Map();
  }

  async registerLed(ledNumber, port, name) {
    const ledId = new LedIdentifier(ledNumber);
    
    if (this.#mappings.has(ledNumber)) {
      throw new Error(`LED ${ledNumber} is already registered`);
    }

    for (const [, mapping] of this.#mappings) {
      if (mapping.port === port) {
        throw new Error(`Port ${port} is already in use`);
      }
    }

    this.#mappings.set(ledNumber, {
      ledNumber,
      port,
      name
    });
  }

  async unregisterLed(ledNumber) {
    this.#mappings.delete(ledNumber);
  }

  async getPortForLed(ledNumber) {
    const mapping = this.#mappings.get(ledNumber);
    return mapping ? mapping.port : null;
  }

  async getLedForPort(port) {
    for (const [ledNumber, mapping] of this.#mappings) {
      if (mapping.port === port) {
        return ledNumber;
      }
    }
    return null;
  }

  async getAllMappings() {
    return Array.from(this.#mappings.values());
  }

  async loadFromEnvironment() {
    this.#mappings.clear();
    
    for (let i = 1; i <= 100; i++) {
      const portKey = `LED_${i}_PORT`;
      const nameKey = `LED_${i}_NAME`;
      
      const port = process.env[portKey];
      const name = process.env[nameKey];
      
      if (port && name) {
        try {
          await this.registerLed(i, port, name);
        } catch (error) {
          console.warn(`Failed to register LED ${i}: ${error.message}`);
        }
      }
    }
  }
}