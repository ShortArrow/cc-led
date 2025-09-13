# Claude Code MCP Setup Guide

## How to Add cc-led MCP Server to Claude Code

### 1. Locate Claude Code Configuration Directory

Find your Claude Code configuration directory:

**Windows:**

```text
%APPDATA%\Claude\claude_desktop_config.json
```

**macOS:**

```text
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Linux:**

```text
~/.config/claude/claude_desktop_config.json
```

### 2. Create/Update Configuration File

If you have an existing configuration file, add to the `mcpServers` section. Otherwise, create a new file:

```json
{
  "mcpServers": {
    "cc-led": {
      "command": "node",
      "args": [
        "V:/cc-led/mcp-server-stdio.js"
      ],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "LED_1_PORT": "/dev/ttyUSB0",
        "LED_1_NAME": "Main LED",
        "LED_2_PORT": "COM3",
        "LED_2_NAME": "Secondary LED", 
        "LED_3_PORT": "/dev/ttyACM0",
        "LED_3_NAME": "Arduino LED"
      }
    }
  }
}
```

### 3. Adjust File Path

Change the first element in the `args` array to the actual path of this repository:

```json
"args": [
  "/path/to/your/cc-led/mcp-server-stdio.js"
]
```

### 4. Configure Environment Variables

In the `env` section, adjust settings to match your actual Arduino ports:

```json
"env": {
  "MCP_TRANSPORT": "stdio",
  "LED_1_PORT": "COM3",           // Windows: COM3, macOS/Linux: /dev/ttyUSB0
  "LED_1_NAME": "Main LED",
  "LED_2_PORT": "COM4",           // Additional LED
  "LED_2_NAME": "Secondary LED"
}
```

### 5. Restart Claude Code

After saving the configuration file, restart Claude Code to enable the MCP server.

### 6. Test MCP Server Functionality

Try the following prompts in Claude Code:

- "List available LEDs"
- "Turn on LED 1 with red color"
- "Check LED 1 status"
- "Make LED 1 blink blue with 1 second interval"
- "Start rainbow effect on LED 1"

### Troubleshooting

1. **MCP Server Won't Start**
   - Verify path is correct
   - Check that Node.js is installed
   - Ensure no permission issues

2. **Can't Control LEDs**
   - Verify Arduino port is correct
   - Check device is connected
   - Ensure environment variables are set correctly

3. **Check Logs**
   Review Claude Code MCP logs for detailed error information

### Manual Testing

Test functionality from command line:

```bash
# Configuration test
node mcp-server-stdio.js

# Test with MCP client tools
echo '{"method":"tools/list","id":1}' | node mcp-server-stdio.js
```

### Available MCP Commands

The cc-led MCP server provides these tools:

- **controlLed**: Control LED state (on/off/blink/rainbow) with color and brightness
- **getLedStatus**: Get current status of a specific LED
- **listAvailableLeds**: List all configured LEDs
- **getVersion**: Get server or hardware version information
