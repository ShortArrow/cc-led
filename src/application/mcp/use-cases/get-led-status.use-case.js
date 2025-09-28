import { LedIdentifier } from '../../../domain/mcp/value-objects/led-identifier.vo.js';

export class GetLedStatusUseCase {
  #ledController;
  #ledMapping;

  constructor(ledController, ledMapping) {
    this.#ledController = ledController;
    this.#ledMapping = ledMapping;
  }

  async execute({ ledNumber }) {
    const ledId = new LedIdentifier(ledNumber);

    const port = await this.#ledMapping.getPortForLed(ledNumber);
    if (!port) {
      throw new Error(`LED ${ledNumber} is not configured`);
    }

    const status = await this.#ledController.getLedStatus(ledNumber);
    
    return {
      ledNumber,
      state: status
    };
  }
}