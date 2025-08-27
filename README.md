# cc-led

This project allows controlling the onboard LED on a arduino using a scriptable interface.

## 📁 Project Structure

```
cc-led/                          # Project root
├── arduino-cli.yaml             # Arduino CLI config (uses .arduino/ for installations)
├── .arduino/                    # Arduino libraries & boards (created by arduino-cli)
│   └── data/                    # Arduino CLI managed directory
│       ├── downloads/           # Downloaded board packages
│       └── packages/            # Installed boards and tools
├── NeoPixel_SerialControl/      # Arduino sketch for LED control
│   ├── NeoPixel_SerialControl.ino
│   └── build/                   # Compiled binaries (after compile)
├── tool/cc-led/xiao-rp2040/     # Node.js CLI tool
│   ├── package.json             # NPM package definition
│   ├── node_modules/            # Node.js dependencies (local)
│   ├── src/                     # JavaScript source code
│   └── test/                    # Vitest test files
└── *.ps1                        # PowerShell scripts (legacy)

## Support

| Board | Status | LED | Signeture | Wiki |
|----------|--------|------|-----------|------|
| Seeed Studio XIAO RP2040 | ✅ Supported | RGB | xiao-rp2040 | [Wiki](https://wiki.seeedstudio.com/XIAO-RP2040/) |
| Raspberry Pi Pico | 📅 W.I.P. | Single | pico | [Wiki](https://www.raspberrypi.com/documentation/microcontrollers/pico-series.html) |
| Arduino Uno R4 Minima | 📅 W.I.P. | Single | uno-r4-minima | [Wiki](https://docs.arduino.cc/hardware/uno-r4-minima/) |
| Arduino Uno R4 WiFi | 📅 W.I.P. | Single | uno-r4-wifi | [Wiki](https://docs.arduino.cc/hardware/uno-r4-wifi/) |
| Waveshare RA4M1-Zero | 📅 W.I.P. | RGB | ra4m1-zero | [Wiki](https://www.waveshare.com/wiki/RA4M1-Zero) |
| Seeed Studio XIAO RA4M1 | 📅 W.I.P. | RGB | xiao-ra4m1 | [Wiki](https://wiki.seeedstudio.com/getting_started_xiao_ra4m1/) |
| Seeed Studio XIAO nRF52840 | 📅 W.I.P. | RGB | xiao-nrf52840 | [Wiki](https://wiki.seeedstudio.com/XIAO_BLE/) |
| Seeed Studio XIAO nRF52840 Sense | 📅 W.I.P. | RGB | xiao-nrf52840-sense | [Wiki](https://wiki.seeedstudio.com/XIAO_BLE/) |

## Prerequisites

- Node.js (v16 or later) and npm
- [Arduino CLI](https://arduino.github.io/arduino-cli/latest/) installed and in your system's PATH
- Arduino board (e.g., XIAO RP2040)
- USB cable for board connection

## Setup

### Quick Start with npx (When Published to npm)

**Note: The package is not yet published to npm. For now, use the Local Development Setup below.**

Once published, you'll be able to use `npx` to run the CLI directly:

```bash
# First time setup - install Arduino boards and libraries
cd cc-led
npx @cc-led/cli --board xiao-rp2040 install

# Compile the LED control sketch
npx @cc-led/cli --board xiao-rp2040 compile NeoPixel_SerialControl

# Upload to your board (replace COM3 with your port)
npx @cc-led/cli --board xiao-rp2040 upload NeoPixel_SerialControl -p COM3

# Control the LED
npx @cc-led/cli --board xiao-rp2040 led --color red -p COM3
npx @cc-led/cli --board xiao-rp2040 led --rainbow -p COM3
```

### 🔧 Local Development Setup (For Developers)

For development and testing without publishing to npm:

```bash
# Clone the repository
git clone https://github.com/ShortArrow/cc-led.git
cd cc-led

# Install CLI dependencies
cd cli
npm install

# Link the CLI globally (creates cc-led command)
npm link

# Now you can use cc-led command anywhere
cc-led --help
cc-led boards
cc-led --board xiao-rp2040 install
```

#### Alternative: Run directly without linking

```bash
# From the cc-led/cli directory
node src/cli.js --help
node src/cli.js boards
node src/cli.js --board xiao-rp2040 compile ../sketches/NeoPixel_SerialControl
node src/cli.js --board xiao-rp2040 led --color red -p COM3
```

#### Running tests

```bash
cd cc-led/cli
npm test           # Run all tests
npm test:watch     # Watch mode for development
npm test:coverage  # Generate coverage report
```

#### Uninstalling local development link

```bash
# When done with development
cd cc-led/cli
npm unlink
```

### PowerShell Setup (Legacy)

1.  **Install Board Cores and Libraries:**
    Run the `install.ps1` script to download and install the required board definitions and libraries. This only needs to be done once.

    ```powershell
    pwsh -nop -f ./install.ps1
    ```

2.  **Upload the Sketch:**
    Use the `deploy.ps1` script to upload the `NeoPixel_SerialControl` sketch to your board. You must provide the sketch name and the correct COM port for your XIAO RP2040.

    ```powershell
    pwsh -nop -f ./deploy.ps1 -SketchName NeoPixel_SerialControl -Port COM6
    ```

3.  **(Optional) Compile a Sketch:**
    If you only want to compile a sketch to check for errors without uploading, you can use the `compile.ps1` script.

    ```powershell
    pwsh -nop -f ./compile.ps1 -SketchName NeoPixel_SerialControl
    ```

## Usage

### Node.js CLI (New)

The Node.js CLI provides a modern interface for controlling your XIAO RP2040 LED.

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
# Default board is xiao-rp2040
cc-led led --on -p COM3                    # Turn LED on (white)
cc-led led --off -p COM3                   # Turn LED off

# Set solid color
cc-led led --color red -p COM3
cc-led led --color "255,128,0" -p COM3     # Custom RGB

# Blink single color
cc-led led --blink --color green --interval 500 -p COM3

# Blink two colors (XIAO RP2040 with RGB LED)
cc-led --board xiao-rp2040 led --blink --color red --second-color blue --interval 1000 -p COM3

# Rainbow effect (XIAO RP2040 with RGB LED)
cc-led --board xiao-rp2040 led --rainbow --interval 50 -p COM3

# For other boards (when supported)
cc-led --board raspberry-pi-pico led --on -p /dev/ttyACM0
cc-led --board arduino-uno-r4 led --blink --interval 500 -p COM5
```

#### Port Configuration

You can set the serial port in multiple ways (in order of priority):

1. Command line: `-p COM3`
2. Environment variable: `SERIAL_PORT=COM3`
3. `.env` file in project root:
   ```
   SERIAL_PORT=COM3
   ```

### PowerShell Examples (Legacy)

- **Turn LED On (Solid White)**

```powershell
.\controller.ps1 -On
```

- **Turn LED Off**

```powershell
.\controller.ps1 -Off
```

- **Set a Solid Color**
  - Available colors: `Red`, `Green`, `Blue`, `Yellow`, `Purple`, `Cyan`, `White`.

```powershell
.\controller.ps1 -Color Red
```

- **Set a Custom Color (e.g., Orange)**

```powershell
.\controller.ps1 -Color Custom -CustomColor "255,165,0"
```

- **Simple Blink (On/Off)**

This blinks green on and off every 200 milliseconds.

```powershell
.\controller.ps1 -Blink -Color Green -Interval 200
```

- **Two-Color Blink**

This blinks between blue and yellow every second.

```powershell
.\controller.ps1 -Blink -BlinkType 2Color -Color Blue -SecondColor Yellow -Interval 1000
```

- **Rainbow Effect**

This cycles through all colors of the rainbow. You can optionally control the speed with `-Interval`.

```powershell
.\controller.ps1 -Rainbow -Interval 20
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

### Directory Management

1. **Arduino CLI Configuration (`arduino-cli.yaml`)**
   - Configures Arduino CLI to use `./.arduino/` for all installations
   - Keeps Arduino libraries separate from Node.js dependencies
   - Board packages install to `.arduino/data/packages/`

2. **Node.js Package (`tool/cc-led/xiao-rp2040/`)**
   - Self-contained Node.js CLI tool
   - `node_modules/` stays local to the package
   - Can be published to npm or used with `npx`

3. **Arduino Sketches**
   - Each sketch in its own directory at project root
   - Compiled binaries go to `<sketch>/build/`
   - Source remains separate from tools

### Why This Structure?

- **Separation of Concerns**: Arduino code, Node.js tools, and configurations are clearly separated
- **Local Dependencies**: Using `.arduino/` keeps Arduino dependencies project-local
- **NPX Compatible**: The Node.js tool works seamlessly with `npx` without global installation
- **Version Control**: `.arduino/` and `node_modules/` are gitignored, only source is tracked

## Claude Code Hooks Setup

Notify with the built-in LED for hooks of Claude code. This allows you to get a visual notification for different states of the agent.

### Requirements

- Seeed Studio Xiao RP2040
- PowerShell 7
- `claude code` with hooks support

### Setup

1.  Upload `NeoPixel_SerialControl/NeoPixel_SerialControl.ino` to the Xiao RP2040.
2.  Configure claude code settings.

Below is an example configuration. You can customize the `controller.ps1` commands to use different colors, blinking, or rainbow effects to your liking. For example, you could have a blinking red light for the `Stop` event and a rainbow effect for `Notification`.

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "pwsh.exe -nol -nop -f V:/poc_xiao_rp2040/controller.ps1 -Color Blue"
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "pwsh.exe -nol -nop -f V:/poc_xiao_rp2040/controller.ps1 -Blink -Color Yellow -Interval 500"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Task|Bash|Glob|Grep|Read|Edit|MultiEdit|Write|WebFetch|WebSearch",
        "hooks": [
          {
            "type": "command",
            "command": "pwsh.exe -nol -nop -f V:/poc_xiao_rp2040/controller.ps1 -Color Green"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "pwsh.exe -nol -nop -f V:/poc_xiao_rp2040/controller.ps1 -Color Purple"
          }
        ]
      }
    ]
  }
}
```

## 🤝 Contributing

We welcome contributions! Whether you want to:

- **Add support for a new Arduino board**
- **Create new LED control sketches** 
- **Improve the CLI tool**
- **Fix bugs or add features**

Please see our **[Contributing Guide](CONTRIBUTING.md)** for detailed instructions on:

- Adding new board support
- Creating sketches
- Testing guidelines  
- Pull request process

### Quick Contributor Setup

```bash
git clone https://github.com/ShortArrow/cc-led.git
cd cc-led/cli
npm install && npm link
cc-led boards  # Test the CLI
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for complete guidelines.
