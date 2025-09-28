# cc-led CLI Requirements & Technical Specifications

This document defines the functional requirements and technical specifications for the cc-led Arduino LED control CLI.

## 🎯 Project Overview

**Purpose**: Unified LED control CLI supporting multiple Arduino boards
**Target Users**: Arduino developers, IoT prototyping, educational use
**Scope**: From basic LED control to advanced pattern control

## 🏗️ Architecture Requirements

### 1. Multi-Board Architecture

```text
cc-led/                     # NPM package root (can be installed globally)
├── package.json           # NPM package definition with global CLI support
├── src/                   # CLI source code
│   ├── cli.js            # Main CLI entry point (bin target)
│   ├── arduino.js        # Arduino CLI wrapper
│   ├── controller.js     # LED controller via serial
│   ├── boards/           # Board management system
│   └── utils/            # Configuration utilities
├── sketches/              # Board configurations & sketches (bundled in package)
│   ├── common/           # Universal command processing (NEW)
│   │   ├── src/         # CommandProcessor.h/c for all boards
│   │   └── test/        # Unity test framework (17 test cases)
│   ├── xiao-rp2040/      # XIAO RP2040 specific
│   ├── raspberry-pi-pico/# Raspberry Pi Pico specific
│   └── arduino-uno-r4/   # Arduino Uno R4 specific
├── test/                  # Test files
└── [user working dir]/    # Where user runs cc-led
    ├── .arduino/          # Local Arduino environment (auto-generated)
    └── arduino-cli.yaml   # Arduino CLI config (auto-generated)
```

**Requirements**:

- Support for new boards without modifying existing code
- Board-specific configurations (FQBN, libraries, LED specs) managed via JSON
- Separate sketch management per board
- **NEW**: Universal command processing shared across all boards
- **NEW**: Arduino-independent testing with Unity framework

### 2. Pluggable Design

```javascript
// Board abstraction
class BaseBoard {
  supportsSketch(sketchName)
  getSketchPath(sketchName)
  getAvailableSketches()
}

// Board-specific implementation
class XiaoRP2040Board extends BaseBoard {
  // XIAO RP2040 specific implementation
}
```

### 3. Universal Command Processing Architecture (NEW)

**Command Processing Pipeline**:

```c
// sketches/common/src/CommandProcessor.h
bool parseColorCommand(const char* cmd, uint8_t* r, uint8_t* g, uint8_t* b);
bool parseBlink1Command(const char* cmd, uint8_t* r, uint8_t* g, uint8_t* b, long* interval);
bool parseBlink2Command(const char* cmd, uint8_t* r1, uint8_t* g1, uint8_t* b1,
                       uint8_t* r2, uint8_t* g2, uint8_t* b2, long* interval);
bool parseRainbowCommand(const char* cmd, long* interval);
void processCommand(const char* cmd, CommandResponse* response);
```

**Integration with SerialCommandHandler**:

```cpp
void SerialCommandHandler::processCommand(const String& cmd) {
  CommandResponse response;
  processCommand(cmd.c_str(), &response);
  if (response.result == COMMAND_ACCEPTED) {
    // Execute LED actions based on parsed parameters
  }
  Serial.println(response.response);
}
```

**Requirements**:

- Pure C implementation for Arduino compatibility
- Arduino-independent unit testing with gcc/g++
- Comprehensive test coverage (17 Unity test cases)
- Eliminates duplicate parsing code across boards

## 📋 Functional Requirements

### 4. Basic CLI Features

| Command | Required | Description |
|---------|----------|-------------|
| `cc-led --help` | ✅ | Show help |
| `cc-led boards` | ✅ | List supported boards |
| `cc-led sketches` | ✅ | List available sketches |
| `cc-led --board <id> install` | ✅ | Install board dependencies |
| `cc-led --board <id> compile <sketch>` | ✅ | Compile sketch |
| `cc-led --board <id> upload <sketch>` | ✅ | Upload sketch |

### 5. LED Control Features

| Feature | RGB LED | GPIO LED | Priority |
|---------|---------|----------|----------|
| On/Off control | ✅ | ✅ | High |
| Color by name | ✅ | - | High |
| Color by RGB values | ✅ | - | High |
| Blink control | ✅ | ✅ | High |
| Two-color blink | ✅ | - | Medium |
| Rainbow effect | ✅ | - | Medium |
| Custom patterns | 🔄 | 🔄 | Low |

### 6. Configuration Management

#### 6.1 Serial Port Priority

**Priority**: Command line args > Environment variables > .env file

```bash
# Command line (highest priority)
cc-led led --color red -p COM3

# Environment variable
export SERIAL_PORT=COM3

# .env file
echo "SERIAL_PORT=COM3" > .env
```

#### 6.2 Arduino CLI Configuration File Priority (NEW)

**Priority**: CLI parameter > Current directory > Auto-generation

**Requirements**:

- `--config-file <path>`: Explicit user specification (highest priority)
- `./arduino-cli.yaml`: Project-specific configuration (priority 2)  
- Auto-generated config: Default configuration in current directory (fallback)

```bash
# Priority 1: CLI Parameter
cc-led --config-file /custom/path/config.yaml install

# Priority 2: Current Directory
cc-led install  # Uses ./arduino-cli.yaml if present

# Priority 3: Auto-Generation  
cc-led install  # Creates arduino-cli.yaml in current directory
```

**Implementation Requirements**:

- Deterministic configuration file resolution
- Debug-level logging of selected config file path
- Error handling for missing or invalid config files
- Independent config per working directory (isolation)

## 🔗 MCP Integration Requirements

### 6. Model Context Protocol (MCP) Server

**Purpose**: Enable external AI applications (like Claude Desktop) to control Arduino LEDs through standardized protocol.

#### 6.1 MCP Server Architecture

```text
External AI App (Claude)
    ↓ MCP Protocol 
MCP Server (cc-led)
    ↓ Serial Commands
Arduino Hardware
```

**Core Requirements**:

- **Transport Support**: stdio and websocket communication protocols
- **Tool Registration**: Dynamic tool discovery via MCP protocol
- **Command Conversion**: Transform MCP parameters to Arduino serial commands
- **Version Management**: Report server and hardware version information

#### 6.2 MCP Command Interface

| MCP Tool | Parameters | Arduino Command | Purpose |
|----------|------------|-----------------|---------|
| `controlLed` | `ledNumber, action, color, brightness, interval` | `ON/OFF/COLOR/BLINK/RAINBOW` | LED control |
| `getLedStatus` | `ledNumber` | *(query only)* | Status inquiry |
| `listAvailableLeds` | *(none)* | *(mapping only)* | LED discovery |
| `getVersion` | `target` | `VERSION` (hardware only) | Version info |

**Parameter Transformation Requirements**:

- **Color Conversion**: `#RRGGBB` → `R,G,B` (0-255 range)
- **Action Mapping**: `on/off/blink/rainbow` → Arduino commands
- **Interval Validation**: 50-5000ms range for blink/rainbow timing
- **LED Mapping**: Virtual LED numbers → physical serial ports

#### 6.3 MCP Protocol Compliance

**Protocol Version**: MCP 2025-06-18 specification
**Required Capabilities**:

- ✅ Tool listing and schema validation
- ✅ Error handling with proper MCP error codes
- ✅ Request/response correlation with ID tracking
- ✅ Graceful timeout handling (2 seconds for hardware commands)

**Error Response Format**:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Method not found: invalidMethod"
  }
}
```

#### 6.4 Environment Configuration

**LED Mapping Configuration**:

```bash
# .env.mcp or environment variables
LED_1_PORT=COM4
LED_1_NAME=RGB LED
LED_2_PORT=COM6  
LED_2_NAME=Single Color LED
MCP_TRANSPORT=stdio
```

**Configuration Requirements**:

- Support for up to 100 virtual LED mappings
- Environment variable fallback hierarchy
- Transport protocol selection (stdio/websocket)
- Port abstraction for hardware independence

#### 6.5 Integration Testing

**MCP Server Validation**:

- ✅ Server startup and protocol initialization
- ✅ Tool registration and schema compliance
- ✅ Command conversion accuracy (24 test cases)
- ✅ Hardware communication integration
- ✅ Error handling and timeout management

**Claude Desktop Integration**:

- Configuration file validation
- Real-time command execution
- Multi-LED control scenarios
- Version information retrieval

## 🔧 Technical Requirements

### 7. Runtime Directory Behavior Requirements

#### 7.1 Command Execution Context

```bash
# Example: User runs cc-led from any directory
cd /home/user/my-project/
cc-led --board xiao-rp2040 compile LEDBlink
```

**Required Behavior**:

1. **Package Resolution**: CLI must locate board files in package installation directory
2. **Environment Creation**: `.arduino/` and `arduino-cli.yaml` created in `/home/user/my-project/`
3. **Sketch Access**: Read sketch from package bundled location (read-only)
4. **Build Output**: Write build files to working directory `.build/` (always writable)
5. **Working Directory Independence**: Same behavior regardless of where command is run

#### 7.2 Installation Method Compatibility

| Installation Method | Package Location | Behavior | Use Case |
|-------------------|------------------|----------|----------|
| `npm install -g cc-led` | System global npm directory | Production use | End users |
| `npx cc-led` | npm cache | Temporary execution | Occasional users |
| `npm link` (dev) | Source repository | Development mode | Contributors |

**Requirement**: All three methods must produce identical functionality

### 8. Node.js CLI Specifications

```json
{
  "name": "cc-led",
  "version": "0.0.1",
  "engines": {
    "node": ">=16.0.0"
  },
  "bin": {
    "cc-led": "./src/cli.js"
  },
  "files": [
    "src/**/*.js",
    "sketches/**/*.json",
    "sketches/**/*.ino",
    "README.md"
  ],
  "dependencies": {
    "commander": "^11.0.0",    // CLI framework
    "dotenv": "^16.3.1",       // Environment variable management
    "serialport": "^12.0.0",   // Serial communication
    "chalk": "^5.3.0"          // Console output coloring
  }
}
```

**Global Installation Support**:

- Can be installed with `npm install -g cc-led`
- Works with `npx cc-led` without installation
- Development with `npm link` for testing

### 9. Arduino CLI Integration

**Requirements**:

- Support Arduino CLI 0.34.0 or higher
- Local `.arduino` directory package management (Python .venv equivalent)
- Dynamic `arduino-cli.yaml` generation
- Configurable arduino-cli.yaml file location with priority system
- Configurable log level support for debugging

#### 9.1 Arduino CLI Configuration File Priority

**Priority Order** (highest to lowest):

1. **CLI Parameter**: `--config-file <path>` (explicit user specification)
2. **Current Directory**: `./arduino-cli.yaml` (project-specific configuration)
3. **Package Directory**: Package installation directory (default configuration)

**Requirements**:

- If CLI parameter is provided, use specified file exclusively
- If no CLI parameter, search current directory for `arduino-cli.yaml`
- If no current directory config found, create default config in current directory
- Default configuration should support all package-bundled board platforms
- Configuration search must be deterministic and logged for debugging

**Implementation**:

```javascript
constructor() {
  // Use package installation directory for board files and sketches
  this.packageRoot = join(__dirname, '..');
  // Current working directory for .arduino and config files
  this.workingDir = process.cwd();
}

createLocalConfig() {
  // Create .arduino directory in current working directory
  // Generate arduino-cli.yaml in current working directory
  // Enables project-specific Arduino environments
}
```

#### 9.2 Log Level Support

**Purpose**: Control verbosity of both cc-led and Arduino CLI output for debugging

**Supported Log Levels**:

- `trace`: Most verbose - all internal operations
- `debug`: Detailed debugging information  
- `info`: General information (default)
- `warn`: Warning messages only
- `error`: Error messages only
- `fatal`: Fatal errors only

**Usage**:

```bash
# Future CLI implementation
cc-led --log-level debug compile LEDBlink
cc-led --log-level trace upload LEDBlink --port COM3
```

**Affected Components**:

- **cc-led CLI**: Controls internal logging (config path selection, command execution details)
- **Arduino CLI**: Log level is passed through to arduino-cli commands

**Requirements**:

- Log level affects both cc-led internal logging and Arduino CLI output
- Default log level is `info` when not specified
- Debug mode displays arduino-cli.yaml path selection and other internal decisions
- Higher verbosity levels include all lower level messages

**Directory Strategy**:

- **Board files & sketches**: Read from package installation directory (`packageRoot`)
- **Arduino environment**: Created in user's current working directory (`workingDir`)
- **Build outputs**: Generated in package's sketch directories

### 10. Global Installation File Path Requirements

#### 10.1 Package Structure (Read-Only)

```text
/usr/local/lib/node_modules/cc-led/    # Linux/Mac global install
C:\Users\<user>\AppData\Roaming\npm\node_modules\@cc-led\cli\  # Windows global install

├── package.json            # NPM package definition
├── src/                    # CLI source code (packageRoot)
│   ├── cli.js             # Main entry point (bin target)
│   ├── arduino.js         # Arduino CLI wrapper
│   ├── controller.js      # LED controller
│   └── sketches/            # Board management
└── sketches/                 # Board configurations & sketches (bundled)
    ├── xiao-rp2040/       # Board-specific directory
    │   ├── board.json     # Board configuration
    │   └── sketches/      # Arduino sketches
    │       └── LEDBlink/   # Sketch directory
    │           └── LEDBlink.ino
    └── arduino-uno-r4/    # Other boards...
```

#### 10.2 User Working Directory (Generated)

```text
/any/user/project/          # User's current working directory
├── .arduino/               # Arduino environment (auto-generated)
│   ├── data/              # Arduino CLI managed
│   │   ├── packages/      # Installed platforms and tools
│   │   ├── downloads/     # Downloaded packages
│   │   └── libraries/     # User libraries
│   └── sketches/          # User sketches (optional)
├── .build/                 # Build outputs (auto-generated)
│   └── <board-id>/        # e.g., xiao-rp2040
│       └── <sketch-name>/ # e.g., LEDBlink
│           ├── *.hex      # Compiled firmware
│           ├── *.elf      # Debug symbols
│           └── *.bin      # Binary files
└── arduino-cli.yaml       # Arduino CLI config (auto-generated)
```

#### 10.3 Path Resolution Rules

| Path Type | Source | Resolution Strategy |
|-----------|--------|-------------------|
| Board configs | `packageRoot/sketches/*/board.json` | Package installation directory (read-only) |
| Sketches | `packageRoot/sketches/*/sketches/*` | Package installation directory (read-only) |
| Arduino environment | `workingDir/.arduino/` | Current working directory (read-write) |
| Config file | `workingDir/arduino-cli.yaml` | Current working directory (read-write) |
| Build output | `workingDir/.build/<board-id>/<sketch>/` | Current working directory (read-write) |

#### 10.4 Cross-Platform Path Requirements

**Windows**:

```text
Package: C:\Users\<user>\AppData\Local\Volta\tools\image\node\<version>\node_modules\@cc-led\cli\
Working: C:\Users\<user>\Projects\my-project\
```

**Linux/Mac**:

```text
Package: /usr/local/lib/node_modules/cc-led/
Working: /home/<user>/projects/my-project/
```

**Development (npm link)**:

```text
Package: /path/to/cc-led/
Working: /any/directory/
```

#### 10.5 File System Operation Requirements

**Package Files (Read-Only)**:

- All files under `packageRoot` must be treated as read-only
- No modification of bundled board configurations or sketches
- Version control does not track generated files

**Working Directory Files (Generated)**:

- `.arduino/` directory: Full read/write access required
- `arduino-cli.yaml`: Auto-generated per project, can be overwritten
- `.build/` directory: Build artifacts with full read/write access

**Security Requirements**:

- No file operations outside package and working directory
- No modification of system-wide Arduino CLI configuration
- User-level permissions only (no sudo/admin required)

**Cleanup Requirements**:

- `.arduino/`, `.build/`, and `arduino-cli.yaml` can be safely deleted
- Package files remain untouched after uninstall
- No global state modification
- Recommend adding `.arduino/`, `.build/`, and `arduino-cli.yaml` to `.gitignore`

**Environment Isolation Requirements**:

- Each working directory gets independent Arduino environment
- Multiple projects can use different board platforms simultaneously
- No interference between different project Arduino setups
- Behaves like Python `.venv` - isolated per-project environments

#### 10.6 Implementation Requirements

**Path Resolution Implementation**:

```javascript
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ArduinoCLI {
  constructor() {
    // Package installation directory (read-only)
    this.packageRoot = join(__dirname, '..');
    // Current working directory (read-write)
    this.workingDir = process.cwd();
  }
}
```

**Critical Requirements**:

- Must use `import.meta.url` and `fileURLToPath` for ESM compatibility
- Package root resolution must work in all npm installation scenarios
- Working directory must be resolved at runtime, not import time
- No hardcoded paths or assumptions about installation location

### 11. Board Configuration Specification

```json
{
  "name": "Board Display Name",
  "id": "board-identifier",
  "fqbn": "package:architecture:board",
  "platform": {
    "package": "package:architecture",
    "version": "1.0.0"
  },
  "libraries": [
    {
      "name": "Library Name",
      "version": "Version"
    }
  ],
  "led": {
    "type": "neopixel|gpio",
    "pin": "Pin Number",
    "power_pin": "Power Pin (optional)",
    "count": "LED Count",
    "protocol": "WS2812|Digital"
  },
  "serial": {
    "baudRate": 9600,
    "defaultPort": {
      "windows": "COM3",
      "linux": "/dev/ttyACM0",
      "darwin": "/dev/tty.usbmodem*"
    }
  },
  "sketches": {
    "SketchName": {
      "path": "sketches/SketchName",
      "description": "Sketch description"
    }
  }
}
```

## 🎨 LED Control Requirements

### 1. RGB LED Control (XIAO RP2040, etc.)

```bash
# Basic control
cc-led led --on                        # White light on
cc-led led --off                       # Turn off
cc-led led --color red                 # Color by name
cc-led led --color "255,128,0"         # RGB values

# Effects
cc-led led --blink --color red --interval 500        # Single color blink
cc-led led --blink --color red --second-color blue   # Two-color blink
cc-led led --rainbow --interval 50                   # Rainbow effect
```

### 2. GPIO LED Control (Arduino Uno R4, Raspberry Pi Pico, etc.)

```bash
# Basic control
cc-led led --on                        # Turn on
cc-led led --off                       # Turn off
cc-led led --blink --interval 500      # Blink
```

## 🧪 Testing Requirements

### 1. Unit Testing

```bash
npm test           # Run all tests with Vitest
npm test:watch     # Watch mode
npm test:coverage  # Coverage measurement
```

**Test Coverage**:

- Arduino CLI execution mocking
- Board configuration loading and validation
- Environment variable priority
- Serial port configuration

### 2. Integration Testing

**Required Test Cases**:

- [ ] `LEDBlink` sketch compilation and upload success
- [ ] LED lighting verification for each board
- [ ] Serial communication control verification

## 🔄 Compatibility Requirements

### 1. Backward Compatibility

- Coexistence with PowerShell version (legacy)
- Continued use of existing sketches
- Support for existing `.env` configuration files

### 2. Forward Compatibility

- No changes to existing CLI when adding new boards
- Sketch format extensibility
- Arduino CLI version upgrade support

## 🚀 Performance Requirements

### 1. Execution Time

| Process | Target Time | Notes |
|---------|-------------|-------|
| CLI startup | < 1 second | Until help display |
| Board list display | < 2 seconds | Board config loading |
| Sketch compilation | < 30 seconds | Arduino CLI dependent |
| Sketch upload | < 10 seconds | Arduino CLI + hardware dependent |
| LED control command | < 3 seconds | Including serial communication |

### 2. Memory Usage

- Node.js process: < 100MB
- `.arduino` directory: < 500MB (after initial setup)

## 📊 Quality Requirements

### 1. Reliability

- CLI execution success rate: 99%+
- Proper error handling for Arduino CLI call failures
- Recovery from serial communication errors

### 2. Maintainability

- Code coupling: Low coupling design
- Board addition: No modification to existing code
- Test coverage: 80%+

### 3. Usability

- Rich help messages
- Clear error messages
- Interactive configuration support (future)

## 🔐 Security Requirements

### 1. File System

- `.arduino` directory only under current directory
- Prohibit arbitrary path file writing
- Execute with user privileges (no sudo required)

### 2. Network

- Access only official URLs used by Arduino CLI
- No external transmission of user data

---

This requirements document defines the complete functional and technical specifications for the cc-led CLI.
