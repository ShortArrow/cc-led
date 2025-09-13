import { WebSocketServer } from 'ws';
import { IMcpTransport } from '../interfaces/mcp-transport.interface.js';

export class McpWebSocketAdapter extends IMcpTransport {
  #server;
  #clients;
  #messageHandler;
  #connectHandler;
  #disconnectHandler;
  #errorHandler;

  constructor() {
    super();
    this.#server = null;
    this.#clients = new Set();
  }

  async initialize(config = {}) {
    const { port = 8080, host = 'localhost' } = config;
    
    this.#server = new WebSocketServer({ 
      port,
      host
    });

    this.#server.on('connection', (ws) => {
      this.#clients.add(ws);
      
      if (this.#connectHandler) {
        this.#connectHandler(ws);
      }

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (this.#messageHandler) {
            const response = await this.#messageHandler(message, ws);
            if (response) {
              ws.send(JSON.stringify(response));
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
          ws.send(JSON.stringify(errorResponse));
        }
      });

      ws.on('close', () => {
        this.#clients.delete(ws);
        if (this.#disconnectHandler) {
          this.#disconnectHandler(ws);
        }
      });

      ws.on('error', (error) => {
        this.#clients.delete(ws);
        if (this.#errorHandler) {
          this.#errorHandler(error, ws);
        }
      });
    });

    this.#server.on('error', (error) => {
      if (this.#errorHandler) {
        this.#errorHandler(error);
      }
    });

    return new Promise((resolve, reject) => {
      this.#server.on('listening', () => {
        console.log(`MCP WebSocket server listening on ws://${host}:${port}`);
        resolve();
      });

      this.#server.on('error', (error) => {
        reject(error);
      });
    });
  }

  async listen(port) {
    await this.initialize({ port });
  }

  async send(data, client = null) {
    const message = JSON.stringify(data);
    
    if (client) {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    } else {
      // Broadcast to all clients
      this.#clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(message);
        }
      });
    }
  }

  async receive() {
    throw new Error('receive() not supported in WebSocket adapter. Use onMessage() instead.');
  }

  async close() {
    if (this.#server) {
      this.#clients.forEach(client => {
        client.close();
      });
      this.#clients.clear();

      return new Promise((resolve) => {
        this.#server.close(() => {
          console.log('MCP WebSocket server closed');
          resolve();
        });
      });
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

  getClientCount() {
    return this.#clients.size;
  }

  getClients() {
    return Array.from(this.#clients);
  }
}