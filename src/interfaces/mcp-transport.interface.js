export class IMcpTransport {
  async initialize(config) {
    throw new Error('Method initialize() must be implemented');
  }

  async listen(port) {
    throw new Error('Method listen() must be implemented');
  }

  async send(data) {
    throw new Error('Method send() must be implemented');
  }

  async receive() {
    throw new Error('Method receive() must be implemented');
  }

  async close() {
    throw new Error('Method close() must be implemented');
  }

  onMessage(callback) {
    throw new Error('Method onMessage() must be implemented');
  }

  onConnect(callback) {
    throw new Error('Method onConnect() must be implemented');
  }

  onDisconnect(callback) {
    throw new Error('Method onDisconnect() must be implemented');
  }

  onError(callback) {
    throw new Error('Method onError() must be implemented');
  }
}