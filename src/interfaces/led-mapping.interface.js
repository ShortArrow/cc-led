export class ILedMapping {
  async getPortForLed(ledNumber) {
    throw new Error('Method getPortForLed() must be implemented');
  }

  async getLedForPort(port) {
    throw new Error('Method getLedForPort() must be implemented');
  }

  async registerLed(ledNumber, port, name) {
    throw new Error('Method registerLed() must be implemented');
  }

  async unregisterLed(ledNumber) {
    throw new Error('Method unregisterLed() must be implemented');
  }

  async getAllMappings() {
    throw new Error('Method getAllMappings() must be implemented');
  }

  async loadFromEnvironment() {
    throw new Error('Method loadFromEnvironment() must be implemented');
  }
}