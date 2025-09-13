export class ILedController {
  async controlLed(ledNumber, action, options = {}) {
    throw new Error('Method controlLed() must be implemented');
  }

  async getLedStatus(ledNumber) {
    throw new Error('Method getLedStatus() must be implemented');
  }

  async listAvailableLeds() {
    throw new Error('Method listAvailableLeds() must be implemented');
  }

  async initializeLed(ledNumber, port, name) {
    throw new Error('Method initializeLed() must be implemented');
  }

  async isLedAvailable(ledNumber) {
    throw new Error('Method isLedAvailable() must be implemented');
  }
}