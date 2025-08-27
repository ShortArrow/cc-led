# cc-led CLI Requirements & Technical Specifications

This document defines the functional requirements and technical specifications for the cc-led Arduino LED control CLI.

## 🎯 Project Overview

**Purpose**: Unified LED control CLI supporting multiple Arduino boards
**Target Users**: Arduino developers, IoT prototyping, educational use
**Scope**: From basic LED control to advanced pattern control

## 🏗️ Architecture Requirements

### 1. Multi-Board Architecture

```text
cc-led/
├── cli/                    # Node.js CLI implementation
├── boards/                 # Board configurations & sketches
│   ├── xiao-rp2040/       # XIAO RP2040 specific
│   ├── raspberry-pi-pico/ # Raspberry Pi Pico specific
│   └── arduino-uno-r4/    # Arduino Uno R4 specific
└── .arduino/              # Local Arduino environment (auto-generated)
```

**Requirements**:
- Support for new boards without modifying existing code
- Board-specific configurations (FQBN, libraries, LED specs) managed via JSON
- Separate sketch management per board

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

## 📋 Functional Requirements

### 1. Basic CLI Features

| Command | Required | Description |
|---------|----------|-------------|
| `cc-led --help` | ✅ | Show help |
| `cc-led boards` | ✅ | List supported boards |
| `cc-led sketches` | ✅ | List available sketches |
| `cc-led --board <id> install` | ✅ | Install board dependencies |
| `cc-led --board <id> compile <sketch>` | ✅ | Compile sketch |
| `cc-led --board <id> upload <sketch>` | ✅ | Upload sketch |

### 2. LED Control Features

| Feature | RGB LED | GPIO LED | Priority |
|---------|---------|----------|----------|
| On/Off control | ✅ | ✅ | High |
| Color by name | ✅ | - | High |
| Color by RGB values | ✅ | - | High |
| Blink control | ✅ | ✅ | High |
| Two-color blink | ✅ | - | Medium |
| Rainbow effect | ✅ | - | Medium |
| Custom patterns | 🔄 | 🔄 | Low |

### 3. Configuration Management

**Priority**: Command line args > Environment variables > .env file

```bash
# Command line (highest priority)
cc-led led --color red -p COM3

# Environment variable
export SERIAL_PORT=COM3

# .env file
echo "SERIAL_PORT=COM3" > .env
```

## 🔧 Technical Requirements

### 1. Node.js CLI Specifications

```json
{
  "name": "@cc-led/cli",
  "version": "2.0.0",
  "engines": {
    "node": ">=16.0.0"
  },
  "dependencies": {
    "commander": "^11.0.0",    // CLI framework
    "dotenv": "^16.3.1",       // Environment variable management
    "serialport": "^12.0.0",   // Serial communication
    "chalk": "^5.3.0"          // Console output coloring
  }
}
```

### 2. Arduino CLI Integration

**Requirements**:
- Support Arduino CLI 0.34.0 or higher
- Local `.arduino` directory package management (Python .venv equivalent)
- Dynamic `arduino-cli.yaml` generation

**Implementation**:
```javascript
createLocalConfig() {
  // Create .arduino directory in current directory
  // Generate arduino-cli.yaml dynamically
  // Implement local dependency management
}
```

### 3. Board Configuration Specification

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