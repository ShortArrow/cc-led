export class McpConfigLoader {
  static loadConfig() {
    const config = {
      transport: process.env.MCP_TRANSPORT || 'websocket',
      port: parseInt(process.env.MCP_WEBSOCKET_PORT || '8080'),
      host: process.env.MCP_HOST || 'localhost',
      logLevel: process.env.MCP_LOG_LEVEL || 'info'
    };

    return config;
  }

  static loadLedMappings() {
    const mappings = [];

    for (let i = 1; i <= 100; i++) {
      const portKey = `LED_${i}_PORT`;
      const nameKey = `LED_${i}_NAME`;
      
      const port = process.env[portKey];
      const name = process.env[nameKey];
      
      if (port && name) {
        mappings.push({
          ledNumber: i,
          port,
          name
        });
      }
    }

    return mappings;
  }

  static validateConfig(config) {
    if (!['websocket', 'stdio'].includes(config.transport)) {
      throw new Error(`Invalid transport: ${config.transport}. Must be 'websocket' or 'stdio'.`);
    }

    if (config.transport === 'websocket') {
      if (config.port < 1 || config.port > 65535) {
        throw new Error(`Invalid port: ${config.port}. Must be between 1 and 65535.`);
      }
    }

    return true;
  }

  static showConfigHelp() {
    console.log('MCP Configuration Environment Variables:');
    console.log('');
    console.log('Server Configuration:');
    console.log('  MCP_TRANSPORT      Transport type (websocket|stdio) [default: websocket]');
    console.log('  MCP_WEBSOCKET_PORT WebSocket port [default: 8080]');
    console.log('  MCP_HOST           WebSocket host [default: localhost]');
    console.log('  MCP_LOG_LEVEL      Log level (debug|info|warn|error) [default: info]');
    console.log('');
    console.log('LED Mapping Configuration:');
    console.log('  LED_<N>_PORT       Port for LED number N (e.g., LED_1_PORT=/dev/ttyUSB0)');
    console.log('  LED_<N>_NAME       Name for LED number N (e.g., LED_1_NAME=Main LED)');
    console.log('');
    console.log('Example:');
    console.log('  export LED_1_PORT=/dev/ttyUSB0');
    console.log('  export LED_1_NAME="Main LED"');
    console.log('  export LED_2_PORT=/dev/ttyUSB1');
    console.log('  export LED_2_NAME="Sub LED"');
    console.log('  export MCP_TRANSPORT=websocket');
    console.log('  export MCP_WEBSOCKET_PORT=8080');
  }
}