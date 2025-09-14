import { McpWebSocketAdapter } from '../../adapters/mcp-websocket.adapter.js';
import { McpStdioAdapter } from '../../adapters/mcp-stdio.adapter.js';
import { McpServer } from './mcp-server.js';
import { McpRequestHandlerService } from '../../application/mcp/services/mcp-request-handler.service.js';
import { ControlLedUseCase } from '../../application/mcp/use-cases/control-led.use-case.js';
import { ListAvailableLedsUseCase } from '../../application/mcp/use-cases/list-available-leds.use-case.js';
import { GetLedStatusUseCase } from '../../application/mcp/use-cases/get-led-status.use-case.js';
import { GetVersionUseCase } from '../../application/mcp/use-cases/get-version.use-case.js';
import { LedMappingService } from '../../application/mcp/services/led-mapping.service.js';
import { LedControllerImpl } from './led-controller-impl.js';

export class McpServerFactory {
  static create(config = {}) {
    const {
      transport = 'websocket',
      port = 8080,
      host = 'localhost',
      ledController = null
    } = config;

    // Create default LED controller if none provided
    const controller = ledController || new LedControllerImpl();

    // Create services
    const ledMapping = new LedMappingService();
    
    // Create use cases
    const controlLedUseCase = new ControlLedUseCase(controller, ledMapping);
    const listLedsUseCase = new ListAvailableLedsUseCase(controller, ledMapping);
    const getLedStatusUseCase = new GetLedStatusUseCase(controller, ledMapping);
    const getVersionUseCase = new GetVersionUseCase(controller);
    
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