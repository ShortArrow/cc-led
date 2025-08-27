# Contributing to cc-led

Thank you for your interest in contributing to cc-led! This guide will help you add support for new Arduino boards and create sketches.

## 🚀 Quick Start for Contributors

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/cc-led.git
cd cc-led

# Set up development environment
cd cli
npm install
npm link  # Creates global cc-led command

# Test the current setup
cc-led boards
cc-led --board xiao-rp2040 sketches
```

## 🔧 Adding Support for a New Board

### Step 1: Create Board Directory Structure

```bash
# Create board directory (use lowercase with hyphens)
mkdir -p boards/your-board-name/sketches
```

### Step 2: Create Board Configuration

Create `boards/your-board-name/board.json`:

```json
{
  "name": "Your Board Display Name",
  "id": "your-board-name",
  "fqbn": "package:architecture:board",
  "platform": {
    "package": "package:architecture",
    "version": "1.0.0"
  },
  "libraries": [
    {
      "name": "Required Library",
      "version": "1.0.0"
    }
  ],
  "led": {
    "type": "neopixel|gpio",
    "pin": 13,
    "power_pin": 11,  // Optional, for boards that need power pin
    "count": 1,
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
    "LEDBlink": {
      "path": "sketches/LEDBlink",
      "description": "Simple LED blink test"
    }
  },
  "notes": "Any special notes about this board",
  "status": "supported"  // or "planned"
}
```

### Step 3: Board Configuration Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | ✅ | Human-readable board name |
| `id` | ✅ | Unique identifier (kebab-case) |
| `fqbn` | ✅ | Arduino CLI Fully Qualified Board Name |
| `platform.package` | ✅ | Arduino platform package |
| `platform.version` | ✅ | Platform version |
| `libraries` | ❌ | Required libraries array |
| `led.type` | ✅ | LED type: `neopixel`, `gpio` |
| `led.pin` | ✅ | LED pin number |
| `led.power_pin` | ❌ | Power pin (if needed) |
| `led.protocol` | ✅ | Protocol: `WS2812`, `Digital` |
| `serial.baudRate` | ✅ | Serial communication baud rate |
| `serial.defaultPort` | ✅ | Default ports per OS |
| `sketches` | ✅ | Supported sketches object |
| `status` | ❌ | `supported` or `planned` |

### Step 4: Test Your Board Configuration

```bash
# Test board loading
cc-led boards
cc-led --board your-board-name sketches

# Test installation (dry run)
cc-led --board your-board-name install
```

## 📝 Adding New Sketches

### Basic Test Sketch: LEDBlink

Every board should include a `LEDBlink` sketch as a **basic write/upload test**. This simple blink sketch:
- Verifies the board connection and upload process works
- Tests the basic LED functionality
- Provides a minimal "Hello World" for new users
- Helps diagnose hardware issues

```cpp
// Basic LEDBlink.ino - Write test for board verification
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);  // or specific pin number
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(500);
  digitalWrite(LED_BUILTIN, LOW);
  delay(500);
}
```

### Step 1: Create Sketch Directory

```bash
# Create sketch in appropriate board directory
mkdir boards/your-board-name/sketches/YourSketchName
```

### Step 2: Write Arduino Sketch

Create `boards/your-board-name/sketches/YourSketchName/YourSketchName.ino`:

```cpp
// Example: boards/xiao-rp2040/sketches/MyLEDPattern/MyLEDPattern.ino

#include <Adafruit_NeoPixel.h>

#define LED_PIN    12
#define POWER_PIN  11
#define LED_COUNT  1

Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  pinMode(POWER_PIN, OUTPUT);
  digitalWrite(POWER_PIN, HIGH);
  
  strip.begin();
  strip.show();
  Serial.begin(9600);
}

void loop() {
  // Your LED pattern code
}
```

### Step 3: Update Board Configuration

Add your sketch to the board's `board.json`:

```json
{
  "sketches": {
    "LEDBlink": {
      "path": "sketches/LEDBlink",
      "description": "Basic LED blink for write/upload testing"
    },
    "YourSketchName": {
      "path": "sketches/YourSketchName", 
      "description": "Description of what your sketch does"
    }
  }
}
```

**Note:** Always include `LEDBlink` as the first sketch for basic functionality testing.

### Step 4: Test Your Sketch

```bash
# Test compilation
cc-led --board your-board-name compile YourSketchName

# Test upload (with connected board)
cc-led --board your-board-name upload YourSketchName -p COM3
```

## 🧪 Testing Guidelines

### Unit Tests

```bash
cd cli
npm test           # Run all tests
npm test:watch     # Watch mode for development
npm test:coverage  # Generate coverage report
```

### Manual Testing Checklist

- [ ] Board appears in `cc-led boards`
- [ ] Sketches appear in `cc-led --board <id> sketches`
- [ ] **LEDBlink compiles and uploads successfully** (basic write test)
- [ ] **LEDBlink produces visible LED blinking** (hardware verification)
- [ ] Other sketches compile: `cc-led --board <id> compile <sketch>`
- [ ] Upload works with real hardware
- [ ] LED control works (if applicable)
- [ ] All tests pass

## 📋 Common Board Types

### RGB LED Boards (NeoPixel/WS2812)
- XIAO RP2040
- XIAO nRF52840 series
- Custom boards with addressable LEDs

**Required:** Power pin management, NeoPixel library

### Simple GPIO LED Boards  
- Arduino Uno R4
- Raspberry Pi Pico
- Most basic Arduino boards

**Required:** Just digital pin control

### Board-Specific Notes

#### XIAO RP2040
```json
{
  "led": {
    "type": "neopixel",
    "pin": 12,
    "power_pin": 11,  // Must be HIGH
    "protocol": "WS2812"
  }
}
```

#### Raspberry Pi Pico
```json
{
  "led": {
    "type": "gpio", 
    "pin": 25,        // Built-in LED
    "protocol": "Digital"
  }
}
```

#### Arduino Uno R4
```json
{
  "led": {
    "type": "gpio",
    "pin": 13,        // Built-in LED
    "protocol": "Digital" 
  }
}
```

## 🔍 Finding Board Information

### FQBN (Fully Qualified Board Name)
```bash
# List installed boards
arduino-cli board listall

# Example FQBNs:
# rp2040:rp2040:seeed_xiao_rp2040
# arduino:renesas_uno:minima  
# rp2040:rp2040:rpipico
```

### Platform Packages
```bash
# Search for platforms
arduino-cli core search <keyword>

# Install platform to test
arduino-cli core install <package>
```

### Required Libraries
```bash  
# Search libraries
arduino-cli lib search <keyword>

# Install library to test
arduino-cli lib install "<library name>"
```

## 📄 Pull Request Guidelines

### PR Checklist

- [ ] New board directory created in `boards/`
- [ ] Valid `board.json` with all required fields
- [ ] At least one working sketch included
- [ ] Board added to README.md support table
- [ ] All tests pass
- [ ] Manual testing completed with real hardware

### PR Description Template

```markdown
## New Board Support: [Board Name]

### Board Information
- **Board:** [Board Name]
- **ID:** `board-id`
- **FQBN:** `package:arch:board`
- **LED Type:** RGB/GPIO
- **Status:** Tested with hardware / Theoretical

### Sketches Added
- `SketchName` - Description

### Testing Done
- [ ] Compilation tested
- [ ] Upload tested with hardware  
- [ ] LED control verified
- [ ] All unit tests pass

### Hardware Used
- Board: [Exact model/version]
- OS: [Windows/Linux/macOS]
- Arduino CLI: [version]
```

## 🐛 Common Issues

### Board Not Detected
```bash
# Check FQBN
arduino-cli board listall | grep <keyword>

# Check platform installation  
arduino-cli core list
```

### Compilation Errors
```bash
# Check library dependencies
arduino-cli lib list

# Install missing libraries
arduino-cli lib install "<library name>"
```

### Upload Errors
```bash
# Check connected boards
arduino-cli board list

# Verify port permissions (Linux/Mac)
sudo usermod -a -G dialout $USER  # Logout/login required
```

## 📚 Resources

- [Arduino CLI Documentation](https://arduino.github.io/arduino-cli/latest/)
- [Arduino Board Manager URLs](https://github.com/arduino/Arduino/wiki/Unofficial-list-of-3rd-party-boards-support-urls)  
- [NeoPixel Library Guide](https://learn.adafruit.com/adafruit-neopixel-uberguide)
- [Project Structure](README.md#project-structure)

## 💬 Getting Help

- Open an [Issue](https://github.com/ShortArrow/cc-led/issues) for questions
- Check existing boards for examples
- Read the [Arduino CLI docs](https://arduino.github.io/arduino-cli/latest/) for platform-specific issues

---

Thank you for contributing to cc-led! 🎉