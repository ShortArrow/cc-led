export class IMcpServer {
  async start() {
    throw new Error('Method start() must be implemented');
  }

  async stop() {
    throw new Error('Method stop() must be implemented');
  }

  async handleRequest(request) {
    throw new Error('Method handleRequest() must be implemented');
  }

  async sendResponse(response) {
    throw new Error('Method sendResponse() must be implemented');
  }

  onConnection(callback) {
    throw new Error('Method onConnection() must be implemented');
  }

  onDisconnection(callback) {
    throw new Error('Method onDisconnection() must be implemented');
  }

  onError(callback) {
    throw new Error('Method onError() must be implemented');
  }
}