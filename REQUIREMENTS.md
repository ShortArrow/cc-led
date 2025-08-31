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
├── boards/                # Board configurations & sketches (bundled in package)
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

### 0. Runtime Directory Behavior Requirements

#### 0.1 Command Execution Context

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

#### 0.2 Installation Method Compatibility

| Installation Method | Package Location | Behavior | Use Case |
|-------------------|------------------|----------|----------|
| `npm install -g cc-led` | System global npm directory | Production use | End users |
| `npx cc-led` | npm cache | Temporary execution | Occasional users |
| `npm link` (dev) | Source repository | Development mode | Contributors |

**Requirement**: All three methods must produce identical functionality

### 1. Node.js CLI Specifications

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
    "boards/**/*.json",
    "boards/**/*.ino",
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

### 2. Arduino CLI Integration

**Requirements**:
- Support Arduino CLI 0.34.0 or higher
- Local `.arduino` directory package management (Python .venv equivalent)
- Dynamic `arduino-cli.yaml` generation

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

**Directory Strategy**:
- **Board files & sketches**: Read from package installation directory (`packageRoot`)
- **Arduino environment**: Created in user's current working directory (`workingDir`)
- **Build outputs**: Generated in package's sketch directories

### 4. Global Installation File Path Requirements

#### 4.1 Package Structure (Read-Only)
```
/usr/local/lib/node_modules/cc-led/    # Linux/Mac global install
C:\Users\<user>\AppData\Roaming\npm\node_modules\@cc-led\cli\  # Windows global install

├── package.json            # NPM package definition
├── src/                    # CLI source code (packageRoot)
│   ├── cli.js             # Main entry point (bin target)
│   ├── arduino.js         # Arduino CLI wrapper
│   ├── controller.js      # LED controller
│   └── boards/            # Board management
└── boards/                 # Board configurations & sketches (bundled)
    ├── xiao-rp2040/       # Board-specific directory
    │   ├── board.json     # Board configuration
    │   └── sketches/      # Arduino sketches
    │       └── LEDBlink/   # Sketch directory
    │           └── LEDBlink.ino
    └── arduino-uno-r4/    # Other boards...
```

#### 4.2 User Working Directory (Generated)
```
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

#### 4.3 Path Resolution Rules

| Path Type | Source | Resolution Strategy |
|-----------|--------|-------------------|
| Board configs | `packageRoot/boards/*/board.json` | Package installation directory (read-only) |
| Sketches | `packageRoot/boards/*/sketches/*` | Package installation directory (read-only) |
| Arduino environment | `workingDir/.arduino/` | Current working directory (read-write) |
| Config file | `workingDir/arduino-cli.yaml` | Current working directory (read-write) |
| Build output | `workingDir/.build/<board-id>/<sketch>/` | Current working directory (read-write) |

#### 4.4 Cross-Platform Path Requirements

**Windows**:
```
Package: C:\Users\<user>\AppData\Local\Volta\tools\image\node\<version>\node_modules\@cc-led\cli\
Working: C:\Users\<user>\Projects\my-project\
```

**Linux/Mac**:
```
Package: /usr/local/lib/node_modules/cc-led/
Working: /home/<user>/projects/my-project/
```

**Development (npm link)**:
```
Package: /path/to/cc-led/
Working: /any/directory/
```

#### 4.5 File System Operation Requirements

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

#### 4.6 Implementation Requirements

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

### 5. Board Configuration Specification

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