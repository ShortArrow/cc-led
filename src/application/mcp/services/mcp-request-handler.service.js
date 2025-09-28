export class McpRequestHandlerService {
  #controlLedUseCase;
  #listLedsUseCase;
  #getLedStatusUseCase;
  #getVersionUseCase;

  constructor(controlLedUseCase, listLedsUseCase, getLedStatusUseCase, getVersionUseCase) {
    this.#controlLedUseCase = controlLedUseCase;
    this.#listLedsUseCase = listLedsUseCase;
    this.#getLedStatusUseCase = getLedStatusUseCase;
    this.#getVersionUseCase = getVersionUseCase;
  }

  async handleRequest(request) {
    try {
      this.#validateRequest(request);

      const { id, method, params = {} } = request;

      switch (method) {
        case 'initialize':
          return await this.#handleInitialize(id, params);
          
        case 'notifications/initialized':
          return await this.#handleNotificationInitialized();
          
        case 'tools/list':
          return await this.#handleToolsList(id);
          
        case 'tools/call':
          return await this.#handleToolsCall(id, params);
          
        case 'controlLed':
          return await this.#handleControlLed(id, params);
          
        case 'getLedStatus':
          return await this.#handleGetLedStatus(id, params);
          
        case 'listAvailableLeds':
          return await this.#handleListAvailableLeds(id);
          
        case 'getVersion':
          return await this.#handleGetVersion(id, params);
          
        default:
          return this.#createErrorResponse(id, -32601, `Method not found: ${method}`);
      }
    } catch (error) {
      const id = request?.id || null;
      
      if (error.code) {
        return this.#createErrorResponse(id, error.code, error.message);
      }
      
      return this.#createErrorResponse(id, -32603, error.message);
    }
  }

  #validateRequest(request) {
    if (!request || typeof request !== 'object') {
      const error = new Error('Invalid Request');
      error.code = -32600;
      throw error;
    }

    if (!request.method || typeof request.method !== 'string') {
      const error = new Error('Invalid Request');
      error.code = -32600;
      throw error;
    }
    
    // Notifications don't require id field
    if (!request.method.startsWith('notifications/') && request.id === undefined) {
      const error = new Error('Invalid Request - id required');
      error.code = -32600;
      throw error;
    }
  }

  async #handleControlLed(id, params) {
    const { ledNumber, action, color, brightness, interval, secondColor } = params;
    
    const result = await this.#controlLedUseCase.execute({
      ledNumber,
      action,
      color,
      brightness,
      interval,
      secondColor
    });

    return {
      jsonrpc: '2.0',
      id,
      result
    };
  }

  async #handleGetLedStatus(id, params) {
    const { ledNumber } = params;
    
    const result = await this.#getLedStatusUseCase.execute({ ledNumber });

    return {
      jsonrpc: '2.0',
      id,
      result
    };
  }

  async #handleListAvailableLeds(id) {
    const result = await this.#listLedsUseCase.execute();

    return {
      jsonrpc: '2.0',
      id,
      result
    };
  }

  async #handleGetVersion(id, params) {
    const { target = 'server' } = params || {};
    
    const result = await this.#getVersionUseCase.execute({ target });

    return {
      jsonrpc: '2.0',
      id,
      result
    };
  }

  async #handleInitialize(id, params) {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2025-06-18',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'cc-led-mcp-server',
          version: '1.0.0'
        }
      }
    };
  }

  async #handleNotificationInitialized() {
    // Notification doesn't require response
    return null;
  }

  async #handleToolsList(id) {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'controlLed',
            description: 'Control LED state (on/off/blink) with optional color and brightness',
            inputSchema: {
              type: 'object',
              properties: {
                ledNumber: {
                  type: 'integer',
                  description: 'LED number (1-100)',
                  minimum: 1,
                  maximum: 100
                },
                action: {
                  type: 'string',
                  enum: ['on', 'off', 'blink', 'rainbow'],
                  description: 'LED action'
                },
                color: {
                  type: 'string',
                  pattern: '^#[0-9A-Fa-f]{6}$',
                  description: 'LED color in hex format (e.g. #FF0000 for red)'
                },
                secondColor: {
                  type: 'string',
                  pattern: '^#[0-9A-Fa-f]{6}$',
                  description: 'Second color for two-color blinking in hex format (e.g. #0000FF for blue)'
                },
                brightness: {
                  type: 'integer',
                  minimum: 0,
                  maximum: 100,
                  description: 'LED brightness (0-100%)'
                },
                interval: {
                  type: 'integer',
                  minimum: 50,
                  maximum: 5000,
                  description: 'Blink interval in milliseconds (50-5000ms)'
                }
              },
              required: ['ledNumber', 'action']
            }
          },
          {
            name: 'getLedStatus',
            description: 'Get current status of a specific LED',
            inputSchema: {
              type: 'object',
              properties: {
                ledNumber: {
                  type: 'integer',
                  description: 'LED number (1-100)',
                  minimum: 1,
                  maximum: 100
                }
              },
              required: ['ledNumber']
            }
          },
          {
            name: 'listAvailableLeds',
            description: 'List all configured LEDs with their current status',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'getVersion',
            description: 'Get version information for server or hardware',
            inputSchema: {
              type: 'object',
              properties: {
                target: {
                  type: 'string',
                  enum: ['server', 'hardware'],
                  description: 'Version target (default: server)'
                }
              }
            }
          }
        ]
      }
    };
  }

  async #handleToolsCall(id, params) {
    const { name, arguments: args } = params;
    
    switch (name) {
      case 'controlLed':
        const controlResult = await this.#controlLedUseCase.execute(args);
        const colorInfo = args.secondColor ? `Colors: ${args.color} / ${args.secondColor}` : (args.color ? `Color: ${args.color}` : '');
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: `LED ${args.ledNumber} ${args.action} successfully. ${colorInfo} ${args.brightness !== undefined ? `Brightness: ${args.brightness}%` : ''}`
              }
            ]
          }
        };
        
      case 'getLedStatus':
        const statusResult = await this.#getLedStatusUseCase.execute(args);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: `LED ${statusResult.ledNumber} status: ${statusResult.state.status}${statusResult.state.color ? ` (${statusResult.state.color})` : ''} at ${statusResult.state.brightness}% brightness`
              }
            ]
          }
        };
        
      case 'listAvailableLeds':
        const listResult = await this.#listLedsUseCase.execute();
        const ledInfo = listResult.map(led => 
          `LED ${led.ledNumber}: ${led.name} - ${led.state.status}${led.state.color ? ` (${led.state.color})` : ''} at ${led.state.brightness}% brightness`
        ).join('\n');
        
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: `Available LEDs:\n${ledInfo}`
              }
            ]
          }
        };
        
      case 'getVersion':
        const versionResult = await this.#getVersionUseCase.execute(args);
        const versionText = args.target === 'hardware' 
          ? `Hardware Version:\n${versionResult.name}\nVersion: ${versionResult.version}\nBoard: ${versionResult.board}\nFirmware: ${versionResult.firmware}\nBuild Date: ${versionResult.buildDate}`
          : `Server Version:\n${versionResult.name} v${versionResult.version}\nCommit: ${versionResult.shortHash} (${versionResult.branch})\nDate: ${versionResult.commitDate}`;
        
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: versionText
              }
            ]
          }
        };
        
      default:
        return this.#createErrorResponse(id, -32601, `Tool not found: ${name}`);
    }
  }

  #createErrorResponse(id, code, message) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message
      }
    };
  }
}