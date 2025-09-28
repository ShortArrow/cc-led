import { IMcpServer } from '../../interfaces/mcp-server.interface.js';

export class McpServer extends IMcpServer {
  #transport;
  #requestHandler;
  #ledMapping;
  #isRunning;

  constructor(transport, requestHandler, ledMapping) {
    super();
    this.#transport = transport;
    this.#requestHandler = requestHandler;
    this.#ledMapping = ledMapping;
    this.#isRunning = false;
  }

  async start(config = {}) {
    if (this.#isRunning) {
      throw new Error('Server is already running');
    }

    // Load LED mappings from environment
    await this.#ledMapping.loadFromEnvironment();

    // Initialize transport
    await this.#transport.initialize(config);

    // Set up message handling
    this.#transport.onMessage(async (message, client) => {
      return await this.handleRequest(message);
    });

    this.#transport.onConnect((client) => {
      // Silent connection
    });

    this.#transport.onDisconnect((client) => {
      // Silent disconnection
    });

    this.#transport.onError((error, client) => {
      // Silent error handling
    });

    this.#isRunning = true;
  }

  async stop() {
    if (!this.#isRunning) {
      return;
    }

    await this.#transport.close();
    this.#isRunning = false;
  }

  async handleRequest(request) {
    try {
      return await this.#requestHandler.handleRequest(request);
    } catch (error) {
      return {
        id: request?.id || null,
        error: {
          code: -32603,
          message: 'Internal error'
        }
      };
    }
  }

  async sendResponse(response) {
    await this.#transport.send(response);
  }

  onConnection(callback) {
    this.#transport.onConnect(callback);
  }

  onDisconnection(callback) {
    this.#transport.onDisconnect(callback);
  }

  onError(callback) {
    this.#transport.onError(callback);
  }

  isRunning() {
    return this.#isRunning;
  }

  getLedMapping() {
    return this.#ledMapping;
  }

  getTransport() {
    return this.#transport;
  }
}