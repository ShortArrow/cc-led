import { Command } from 'commander';
import { McpServerFactory } from '../../infrastructure/mcp/mcp-server-factory.js';
import { McpConfigLoader } from './mcp-config-loader.js';

export function createMcpCommands() {
  const mcpCommand = new Command('mcp');
  mcpCommand.description('MCP (Model Context Protocol) server commands');

  mcpCommand
    .command('start')
    .description('Start MCP server')
    .option('-t, --transport <type>', 'Transport type (websocket|stdio)', 'websocket')
    .option('-p, --port <number>', 'Port number for WebSocket transport', '8080')
    .option('-h, --host <hostname>', 'Host for WebSocket transport', 'localhost')
    .action(async (options) => {
      try {
        const config = McpConfigLoader.loadConfig();
        
        // Merge CLI options with config
        const serverConfig = {
          ...config,
          transport: options.transport,
          port: parseInt(options.port),
          host: options.host
        };

        // Create real LED controller from config
        const { LedController } = await import('../../controller.js');
        const realLedController = createRealLedController(LedController);
        serverConfig.ledController = realLedController;

        console.log('Starting MCP server...');
        console.log(`Transport: ${serverConfig.transport}`);
        if (serverConfig.transport === 'websocket') {
          console.log(`Host: ${serverConfig.host}`);
          console.log(`Port: ${serverConfig.port}`);
        }

        const server = await McpServerFactory.createAndStart(serverConfig);

        // Graceful shutdown
        process.on('SIGINT', async () => {
          console.log('\\nShutting down MCP server...');
          await server.stop();
          process.exit(0);
        });

        process.on('SIGTERM', async () => {
          console.log('\\nShutting down MCP server...');
          await server.stop();
          process.exit(0);
        });

        // Keep the process alive
        await new Promise(() => {});

      } catch (error) {
        console.error('Failed to start MCP server:', error.message);
        process.exit(1);
      }
    });

  mcpCommand
    .command('config')
    .description('Show MCP configuration')
    .action(() => {
      try {
        const config = McpConfigLoader.loadConfig();
        console.log('MCP Configuration:');
        console.log(JSON.stringify(config, null, 2));
      } catch (error) {
        console.error('Failed to load configuration:', error.message);
        process.exit(1);
      }
    });

  mcpCommand
    .command('list-leds')
    .description('List configured LED mappings')
    .action(() => {
      try {
        const mappings = McpConfigLoader.loadLedMappings();
        if (mappings.length === 0) {
          console.log('No LED mappings configured.');
          console.log('Set environment variables like LED_1_PORT and LED_1_NAME to configure LEDs.');
        } else {
          console.log('Configured LED mappings:');
          mappings.forEach(mapping => {
            console.log(`  LED ${mapping.ledNumber}: ${mapping.name} (${mapping.port})`);
          });
        }
      } catch (error) {
        console.error('Failed to load LED mappings:', error.message);
        process.exit(1);
      }
    });

  return mcpCommand;
}

function createRealLedController(LedController) {
  return {
    async controlLed(ledNumber, action, options = {}) {
      // Get port from LED mapping
      const mappings = McpConfigLoader.loadLedMappings();
      const ledMapping = mappings.find(m => m.ledNumber === ledNumber);
      
      if (!ledMapping) {
        throw new Error(`LED ${ledNumber} is not configured`);
      }

      // Create controller for the specific port
      const controller = new LedController(ledMapping.port, { baudRate: 9600 });
      
      // Connect to the port
      await controller.connect();
      
      try {
        // Handle different actions with secondColor support
        if (action === 'on') {
          if (options.color) {
            await controller.setColor(options.color);
          } else {
            await controller.turnOn();
          }
        } else if (action === 'off') {
          await controller.turnOff();
        } else if (action === 'blink') {
          if (options.secondColor) {
            // Two-color blink
            await controller.blink2Colors(
              options.color || 'white',
              options.secondColor,
              options.interval || 500
            );
          } else {
            // Single color blink
            await controller.blink(options.color || 'white', options.interval || 500);
          }
        } else if (action === 'rainbow') {
          await controller.rainbow(options.interval || 50);
        }
        
        return { success: true, status: action };
      } finally {
        // Disconnect after operation
        await controller.disconnect();
      }
    },

    async getLedStatus(ledNumber) {
      // For real hardware, return basic status
      return {
        status: 'unknown', // Can't query status from hardware easily
        color: null,
        brightness: 100
      };
    },

    async getHardwareVersion() {
      // Get port from first LED mapping
      const mappings = McpConfigLoader.loadLedMappings();
      if (mappings.length === 0) {
        throw new Error('No LED mappings configured');
      }

      const controller = new LedController(mappings[0].port, { baudRate: 9600 });
      await controller.connect();
      try {
        return await controller.getVersion();
      } finally {
        await controller.disconnect();
      }
    },

    async listAvailableLeds() {
      const mappings = McpConfigLoader.loadLedMappings();
      return mappings.map(mapping => ({
        ledNumber: mapping.ledNumber,
        name: mapping.name
      }));
    }
  };
}

function createMockLedController() {
  const ledStates = new Map();

  return {
    async controlLed(ledNumber, action, options = {}) {
      const state = {
        status: action,
        color: options.color || null,
        brightness: options.brightness || (action === 'off' ? 0 : 100)
      };
      
      ledStates.set(ledNumber, state);
      
      console.log(`LED ${ledNumber} ${action}`, options.color ? `color: ${options.color}` : '', options.brightness !== undefined ? `brightness: ${options.brightness}` : '');
      
      return { success: true };
    },

    async getLedStatus(ledNumber) {
      return ledStates.get(ledNumber) || {
        status: 'off',
        color: null,
        brightness: 0
      };
    },

    async listAvailableLeds() {
      const mappings = McpConfigLoader.loadLedMappings();
      return mappings.map(mapping => ({
        ledNumber: mapping.ledNumber,
        name: mapping.name
      }));
    }
  };
}