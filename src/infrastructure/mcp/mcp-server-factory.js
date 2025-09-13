import { McpWebSocketAdapter } from '../../adapters/mcp-websocket.adapter.js';
import { McpStdioAdapter } from '../../adapters/mcp-stdio.adapter.js';
import { McpServer } from './mcp-server.js';
import { McpRequestHandlerService } from '../../application/mcp/services/mcp-request-handler.service.js';
import { ControlLedUseCase } from '../../application/mcp/use-cases/control-led.use-case.js';
import { ListAvailableLedsUseCase } from '../../application/mcp/use-cases/list-available-leds.use-case.js';
import { GetLedStatusUseCase } from '../../application/mcp/use-cases/get-led-status.use-case.js';
import { GetVersionUseCase } from '../../application/mcp/use-cases/get-version.use-case.js';
import { LedMappingService } from '../../application/mcp/services/led-mapping.service.js';

export class McpServerFactory {
  static create(config = {}) {
    const {
      transport = 'websocket',
      port = 8080,
      host = 'localhost',
      ledController = null
    } = config;

    if (!ledController) {
      throw new Error('LED controller is required');
    }

    // Create services
    const ledMapping = new LedMappingService();
    
    // Create use cases
    const controlLedUseCase = new ControlLedUseCase(ledController, ledMapping);
    const listLedsUseCase = new ListAvailableLedsUseCase(ledController, ledMapping);
    const getLedStatusUseCase = new GetLedStatusUseCase(ledController, ledMapping);
    const getVersionUseCase = new GetVersionUseCase(ledController);
    
    // Create request handler
    const requestHandler = new McpRequestHandlerService(
      controlLedUseCase,
      listLedsUseCase,
      getLedStatusUseCase,
      getVersionUseCase
    );

    // Create transport adapter
    let transportAdapter;
    switch (transport.toLowerCase()) {
      case 'websocket':
        transportAdapter = new McpWebSocketAdapter();
        break;
      case 'stdio':
        transportAdapter = new McpStdioAdapter();
        break;
      default:
        throw new Error(`Unsupported transport: ${transport}`);
    }

    // Create and configure server
    const server = new McpServer(transportAdapter, requestHandler, ledMapping);
    
    return server;
  }

  static async createAndStart(config = {}) {
    const server = McpServerFactory.create(config);
    await server.start(config);
    return server;
  }
}