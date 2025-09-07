# cc-led

This project allows controlling the onboard LED on a arduino using a scriptable interface.

## 📁 Project Structure

```
cc-led/                          # NPM package root
├── package.json                 # NPM package definition
├── src/                         # CLI source code
│   ├── cli.js                  # Main CLI entry point
│   ├── arduino.js              # Arduino CLI wrapper
│   ├── controller.js           # LED controller via serial
│   ├── boards/                 # Board management
│   └── utils/                  # Utilities
├── boards/                      # Board configurations and sketches
│   ├── xiao-rp2040/            # XIAO RP2040 support
│   │   ├── board.json          # Board configuration
│   │   └── sketches/           # Arduino sketches
│   ├── arduino-uno-r4/         # Arduino Uno R4 support
│   │   ├── board.json          # Board configuration
│   │   └── sketches/           # Arduino sketches
│   └── raspberry-pi-pico/      # Raspberry Pi Pico support
├── test/                        # Vitest test files
└── legacy/                      # PowerShell scripts (legacy)
```

## Support

- Claude Code ✅ Supporte
- Codex  📅 W.I.P. 
- Gemini  📅 W.I.P. 

| Board | Status | LED | Signeture | Wiki |
|----------|--------|------|-----------|------|
| Seeed Studio XIAO RP2040 | ✅ Supported | RGB | xiao-rp2040 | [Wiki](https://wiki.seeedstudio.com/XIAO-RP2040/) |
| Arduino Uno R4 Minima | ✅ Supported | Digital | arduino-uno-r4 | [Wiki](https://docs.arduino.cc/hardware/uno-r4-minima/) |
| Raspberry Pi Pico | ✅ Supported | Digital | raspberry-pi-pico | [Wiki](https://www.raspberrypi.com/documentation/microcontrollers/pico-series.html) |
| Arduino Uno R4 WiFi | 📅 W.I.P. | Digital | uno-r4-wifi | [Wiki](https://docs.arduino.cc/hardware/uno-r4-wifi/) |
| Waveshare RA4M1-Zero | 📅 W.I.P. | RGB | ra4m1-zero | [Wiki](https://www.waveshare.com/wiki/RA4M1-Zero) |
| Seeed Studio XIAO RA4M1 | 📅 W.I.P. | RGB | xiao-ra4m1 | [Wiki](https://wiki.seeedstudio.com/getting_started_xiao_ra4m1/) |
| Seeed Studio XIAO nRF52840 | 📅 W.I.P. | RGB | xiao-nrf52840 | [Wiki](https://wiki.seeedstudio.com/XIAO_BLE/) |
| Seeed Studio XIAO nRF52840 Sense | 📅 W.I.P. | RGB | xiao-nrf52840-sense | [Wiki](https://wiki.seeedstudio.com/XIAO_BLE/) |
| WaveShare RP2350-Matrix | 📅 W.I.P. | RGB | rp2350-matrix | |
| WaveShare ESP32-H2-ZERO | 📅 W.I.P. | RGB | esp32-h2-zero | |
| Pimoroni Tiny 2040 | 📅 W.I.P. | RGB | tiny-2040 | |

## Prerequisites

- Node.js (v16 or later) and npm
- [Arduino CLI](https://arduino.github.io/arduino-cli/latest/) installed and in your system's PATH
- Arduino board (e.g., XIAO RP2040)
- USB cable for board connection

**WSL Users**: Use [usbipd](https://github.com/dorssel/usbipd-win) to share USB devices between Windows and WSL for board connectivity.

## Setup

### Quick Start with npm Global Install

Install the CLI globally via npm:

```bash
# Install globally
npm install -g cc-led

# Install Arduino dependencies for your board
cc-led --board xiao-rp2040 install        # For XIAO RP2040
cc-led --board arduino-uno-r4 install     # For Arduino Uno R4
cc-led --board raspberry-pi-pico install  # For Raspberry Pi Pico

# Compile and upload the control sketch (same for all boards)
cc-led --board xiao-rp2040 compile UniversalLedControl
cc-led --board xiao-rp2040 upload UniversalLedControl -p COM3

# For Arduino Uno R4
cc-led --board arduino-uno-r4 compile UniversalLedControl
cc-led --board arduino-uno-r4 upload UniversalLedControl -p COM3

# For Raspberry Pi Pico
cc-led --board raspberry-pi-pico compile UniversalLedControl
cc-led --board raspberry-pi-pico upload UniversalLedControl -p COM3

# Control the LED (no --board needed - universal protocol)
cc-led led --color red -p COM3      # Works on any board
cc-led led --blink -p COM3          # Universal blink command  
cc-led led --on -p COM3             # Universal on command
```

### Quick Start with npx (Alternative)

You can also use `npx` without global installation:

```bash
# First time setup - install Arduino boards and libraries
npx cc-led --board xiao-rp2040 install

# Compile the LED control sketch (same for all boards)
npx cc-led --board xiao-rp2040 compile UniversalLedControl

# Upload to your board (replace COM3 with your port)
npx cc-led --board xiao-rp2040 upload UniversalLedControl -p COM3

# Control the LED (universal protocol)
npx cc-led led --color red -p COM3   # Works on any board
npx cc-led led --blink -p COM3       # Universal command
```

### 🔧 Development Setup

For contributors and developers working on cc-led itself:

```bash
# Clone the repository
git clone https://github.com/ShortArrow/cc-led.git
cd cc-led

# Install dependencies
npm install

# Link for development
npm link

# Run tests
npm test
```

See our **[Contributing Guide](docs/CONTRIBUTING.md)** for detailed development instructions.

### Legacy PowerShell Setup

For users of the original PowerShell scripts, see files in the `legacy/` directory.

> **💡 Recommendation**: New users should use the modern CLI setup above for better cross-platform support and ongoing development.

## Usage

The CLI provides a modern interface for controlling Arduino board LEDs across multiple platforms.

#### Available Commands

```bash
# Show help
cc-led --help

# List available boards
cc-led boards

# Install Arduino dependencies (run once per board)
cc-led --board <board-id> install

# Compile Arduino sketch
cc-led --board <board-id> compile <sketch-name>

# Upload sketch to board
cc-led --board <board-id> upload <sketch-name> -p <port>

# Control LED
cc-led --board <board-id> led [options]

# Show examples
cc-led examples
```

#### LED Control Examples

```bash
# Universal LED Control (works on all boards)
cc-led led --on -p COM3                    # Turn LED on (white)
cc-led led --off -p COM3                   # Turn LED off

# Set solid color (RGB boards show color, Digital LEDs show white/on)
cc-led led --color red -p COM3
cc-led led --color "255,128,0" -p COM3     # Custom RGB

# Blink single color
cc-led led --blink --color green --interval 500 -p COM3

# Blink two colors (RGB boards alternate colors, Digital LEDs blink white)
cc-led led --blink --color red --second-color blue --interval 1000 -p COM3

# Rainbow effect (RGB boards show rainbow, Digital LEDs blink)
cc-led led --rainbow --interval 50 -p COM3

# Examples on different ports (same commands work on all boards)
cc-led led --on -p COM3                      # XIAO RP2040 on COM3
cc-led led --blink -p COM5                   # Arduino Uno R4 on COM5
cc-led led --color blue -p COM6              # Raspberry Pi Pico on COM6
cc-led led --rainbow --interval 30 -p COM7   # Any board on COM7
```

#### Port Configuration

You can set the serial port in multiple ways (in order of priority):

1. Command line: `-p COM3`
2. Environment variable: `SERIAL_PORT=COM3`
3. `.env` file in project root:

   ```
   SERIAL_PORT=COM3
   ```


### Finding Your COM Port

**Windows:**

```bash
# In Device Manager, look for "Ports (COM & LPT)"
# Or use PowerShell:
Get-PnpDevice -Class Ports
```

**Linux/Mac:**

```bash
ls /dev/tty*  # Look for /dev/ttyACM0 or similar
```

## 🔧 How It Works

### Universal LED Control Protocol

cc-led implements a **universal protocol** that works across all supported boards through a unified command processing system:

1. **Arduino-Independent Command Processing**
   - Pure C implementation in `boards/common/src/CommandProcessor.h/c`
   - Shared parsing logic across all board types
   - Comprehensive unit testing with Unity framework (17 test cases)

2. **Board-Agnostic CLI Commands**
   ```bash
   # Same commands work on all boards
   cc-led led --color red -p COM3      # RGB boards show red, Digital LEDs turn on
   cc-led led --blink -p COM3          # All boards blink
   cc-led led --rainbow -p COM3        # RGB boards show rainbow, Digital LEDs blink
   ```

3. **Clean Architecture with Dependency Injection**
   - Interface-based testing with mock adapters
   - No test interference between different phases
   - 110+ test cases with full coverage

### Arduino CLI Configuration Priority System

cc-led now supports flexible configuration file management:

**Priority Order** (highest to lowest):
1. **CLI Parameter**: `--config-file <path>` (explicit user specification)
2. **Current Directory**: `./arduino-cli.yaml` (project-specific configuration)  
3. **Auto-Generated**: Default configuration created in current directory

```bash
# Explicit config file
cc-led --config-file /custom/config.yaml install

# Uses ./arduino-cli.yaml if present
cc-led install  # Searches current directory first

# Auto-creates arduino-cli.yaml if none found
cc-led install  # Creates default config in current directory
```

### Directory Management

1. **Arduino CLI Configuration (`arduino-cli.yaml`)**
   - Configures Arduino CLI to use `./.arduino/` for all installations
   - Keeps Arduino libraries separate from Node.js dependencies
   - Board packages install to `.arduino/data/packages/`
   - **NEW**: Automatic configuration file resolution with priority system

2. **Node.js Package**
   - Self-contained Node.js CLI tool
   - `node_modules/` stays local to the package
   - Can be published to npm or used with `npx`

3. **Arduino Sketches**
   - Each sketch in its own directory at project root
   - Compiled binaries go to `<sketch>/.build/`
   - Source remains separate from tools
   - **NEW**: Universal LED control sketch works on all boards

### Working Directory Behavior

When you run `cc-led` from any directory, it creates:

- **`.arduino/`**: Arduino environment (boards, libraries, tools) in current working directory
- **`arduino-cli.yaml`**: Configuration file in current working directory with automatic priority resolution
- **`.build/`**: Compilation output in the sketch directory (inside package)

This design allows each project to have its own isolated Arduino environment, similar to Python's `.venv`.

### Why This Structure?

- **Global Installation Ready**: Can be installed with `npm install -g` or used with `npx`
- **Local Arduino Environment**: Each working directory gets its own `.arduino/` environment
- **Board & Sketch Bundling**: All board configurations and sketches included in package
- **Development Friendly**: Simple `npm link` for development, comprehensive test coverage

## Claude Code Hooks Integration

Get visual LED notifications for Claude Code events! Set up your Arduino board to light up when the AI agent starts, stops, or uses tools.

**→ See [Claude Code Hooks Guide](docs/CLAUDE_CODE_HOOKS.md)** for complete setup instructions with both modern CLI and legacy PowerShell configurations.

## 📖 Documentation

- **[CLI-Serial Protocol Specification](docs/CLI-Serial-Protocol-Specification.md)** - Detailed specification of CLI options, serial commands, and response handling
- **[Contributing Guide](docs/CONTRIBUTING.md)** - How to contribute to the project
- **[Claude Code Hooks Guide](docs/CLAUDE_CODE_HOOKS.md)** - Integration with Claude Code editor
- **[Legacy Documentation](docs/LEGACY.md)** - Information about the original PowerShell implementation
- **[Requirements](docs/REQUIREMENTS.md)** - System requirements and dependencies

## 🤝 Contributing

We welcome contributions! Whether you want to:

- **Add support for a new Arduino board**
- **Create new LED control sketches**
- **Improve the CLI tool**
- **Fix bugs or add features**

Please see our **[Contributing Guide](docs/CONTRIBUTING.md)** for detailed instructions on:

- Adding new board support
- Creating sketches
- Testing guidelines  
- Pull request process

