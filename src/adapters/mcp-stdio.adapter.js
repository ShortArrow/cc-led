import { IMcpTransport } from '../interfaces/mcp-transport.interface.js';

export class McpStdioAdapter extends IMcpTransport {
  #messageHandler;
  #connectHandler;
  #disconnectHandler;
  #errorHandler;
  #isRunning;

  constructor() {
    super();
    this.#isRunning = false;
  }

  async initialize(config = {}) {
    if (this.#isRunning) {
      throw new Error('Stdio adapter is already initialized');
    }

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', async (data) => {
      try {
        const lines = data.toString().trim().split('\n');
        
        for (const line of lines) {
          if (line.trim()) {
            const message = JSON.parse(line);
            if (this.#messageHandler) {
              const response = await this.#messageHandler(message);
              if (response) {
                await this.send(response);
              }
            }
          }
        }
      } catch (error) {
        const errorResponse = {
          id: null,
          error: {
            code: -32700,
            message: 'Parse error'
          }
        };
        await this.send(errorResponse);
      }
    });

    process.stdin.on('end', () => {
      if (this.#disconnectHandler) {
        this.#disconnectHandler();
      }
    });

    process.stdin.on('error', (error) => {
      if (this.#errorHandler) {
        this.#errorHandler(error);
      }
    });

    this.#isRunning = true;
    
    if (this.#connectHandler) {
      this.#connectHandler();
    }
  }

  async listen(port) {
    await this.initialize();
  }

  async send(data) {
    const message = JSON.stringify(data);
    process.stdout.write(message + '\n');
  }

  async receive() {
    if (!this.#isRunning) {
      throw new Error('Stdio adapter not initialized');
    }

    return new Promise((resolve, reject) => {
      const onData = (data) => {
        try {
          const message = JSON.parse(data.toString().trim());
          process.stdin.off('data', onData);
          resolve(message);
        } catch (error) {
          process.stdin.off('data', onData);
          reject(error);
        }
      };

      process.stdin.on('data', onData);
    });
  }

  async close() {
    if (this.#isRunning) {
      this.#isRunning = false;
      process.stdin.pause();
    }
  }

  onMessage(callback) {
    this.#messageHandler = callback;
  }

  onConnect(callback) {
    this.#connectHandler = callback;
  }

  onDisconnect(callback) {
    this.#disconnectHandler = callback;
  }

  onError(callback) {
    this.#errorHandler = callback;
  }

  isRunning() {
    return this.#isRunning;
  }
}