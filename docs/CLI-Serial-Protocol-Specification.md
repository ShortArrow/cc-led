# 🔌 CLI-Serial Protocol Specification

> **Complete technical reference for cc-led CLI command mapping and microcontroller communication protocol**

## 📋 Table of Contents

1. [🎯 Quick Reference](#-quick-reference)
2. [📖 Protocol Overview](#-protocol-overview)
3. [⚡ Basic Commands](#-basic-commands)
4. [🌈 Advanced Effects](#-advanced-effects)
5. [🔄 Command Priority Logic](#-command-priority-logic)
6. [✅ Input Validation](#-input-validation)
7. [📡 Response Processing](#-response-processing)
8. [🔄 Universal Protocol](#-universal-protocol)
9. [❌ Error Handling](#-error-handling)
10. [⚡ Performance](#-performance)
11. [🔧 Integration Examples](#-integration-examples)
12. [📚 Related Documentation](#-related-documentation)

---

## 🎯 Quick Reference

| CLI Command | Serial Output | LED Behavior |
|-------------|---------------|--------------|
| `--on` | `ON\n` | Turn on with last/default color |
| `--off` | `OFF\n` | Turn off completely |
| `--color red` | `COLOR,255,0,0\n` | Solid red color |
| `--blink` | `BLINK1,255,255,255,500\n` | White blink (500ms) |
| `--rainbow` | `RAINBOW,50\n` | Rainbow effect (50ms) |
| `--firmware-version` | `VERSION\n` | *(Hardware version inquiry)* |

**💡 Common Patterns:**

- `cc-led led --port COM3 --color blue` → Blue LED
- `cc-led led --port COM3 --blink red --interval 1000` → Red blink every 1s
- `cc-led led --port COM3 --rainbow --interval 30` → Fast rainbow
- `cc-led led --port COM3 --firmware-version` → Hardware version info
- `cc-led info` → Comprehensive project information
- `cc-led info --version-git` → Git version information
- `cc-led --version` → CLI tool version (legacy, use `cc-led info`)

**🔧 Board Transparency:**

The LED control protocol is board-agnostic. All boards use the same command format:

- **No `--board` option needed** for LED commands
- **Universal protocol**: Board firmware adapts commands to available LED capabilities
- **Same commands**: Work across XIAO RP2040, Arduino Uno R4, Raspberry Pi Pico

---

## 📖 Protocol Overview

This specification defines how CLI options map to serial commands sent to Arduino microcontrollers, enabling precise LED control through a standardized communication protocol.

**🔗 Related Documentation:**

- [📋 Board Configuration Guide](CONTRIBUTING.md#adding-support-for-a-new-board) - Board-specific settings
- [🎨 Claude Code Integration](CLAUDE_CODE_HOOKS.md) - Hook usage examples
- [🚀 Getting Started](../README.md) - Basic usage guide

## ⚡ Basic Commands

### 🔌 Power Control

#### ON Command

- **CLI Option**: `--on`
- **Serial Output**: `ON\n`
- **LED Behavior**: Turn on with last used color or default color
- **Compatible Boards**: All supported boards

#### OFF Command  

- **CLI Option**: `--off`
- **Serial Output**: `OFF\n`
- **LED Behavior**: Turn off completely
- **Compatible Boards**: All supported boards

### 🎨 Color Control

#### Static Color Setting

- **CLI Option**: `--color <color>`
- **Serial Output**: `COLOR,<r>,<g>,<b>\n`
- **LED Behavior**: Set solid color
- **Compatible Boards**: RGB LEDs (XIAO RP2040), Limited support on Digital LEDs

**🌈 Supported Color Formats:**

| Format | Example | Serial Output |
|--------|---------|---------------|
| Color Names | `red`, `green`, `blue`, `yellow`, `purple`, `cyan`, `white` | `COLOR,255,0,0\n` |
| RGB Values | `255,0,0` (0-255 integers) | `COLOR,255,0,0\n` |
| Case Insensitive | `RED` = `red` | `COLOR,255,0,0\n` |

**✨ Examples:**

```bash
cc-led led --port COM3 --color red        # → COLOR,255,0,0\n
cc-led led --port COM3 --color blue       # → COLOR,0,0,255\n  
cc-led led --port COM3 --color "100,150,200"  # → COLOR,100,150,200\n
```

---

## 🌈 Advanced Effects

### ✨ Blink Patterns

#### Single Color Blink (BLINK1)

- **CLI Option**: `--blink [color] [--interval <ms>]`
- **Serial Output**: `BLINK1,<r>,<g>,<b>,<interval>\n`
- **LED Behavior**: Alternates between specified color and off
- **Defaults**: color=white, interval=500ms
- **Compatible Boards**: All supported boards

**Examples:**

```bash
cc-led led --port COM3 --blink                     # → BLINK1,255,255,255,500\n (white, 500ms)
cc-led led --port COM3 --blink red --interval 1000 # → BLINK1,255,0,0,1000\n
cc-led led --port COM3 --blink --color blue --interval 200  # → BLINK1,0,0,255,200\n
```

#### Two Color Blink (BLINK2)

- **CLI Option**: `--blink <color1> --second-color <color2> [--interval <ms>]`
- **Serial Output**: `BLINK2,<r1>,<g1>,<b1>,<r2>,<g2>,<b2>,<interval>\n`
- **LED Behavior**: Alternates between two specified colors
- **Compatible Boards**: RGB LEDs only (XIAO RP2040)

**Example:**

```bash
cc-led led --port COM3 --blink red --second-color blue --interval 750
# → BLINK2,255,0,0,0,0,255,750\n
```

### 🌈 Rainbow Effects

#### Rainbow Effect

- **CLI Option**: `--rainbow [--interval <ms>]`
- **Serial Output**: `RAINBOW,<interval>\n`
- **LED Behavior**: Cycles through color spectrum
- **Default**: interval=50ms
- **Compatible Boards**: RGB LEDs only (XIAO RP2040)

**Examples:**

```bash
cc-led led --port COM3 --rainbow                 # → RAINBOW,50\n
cc-led led --port COM3 --rainbow --interval 100  # → RAINBOW,100\n
```

### 🔍 Version and Information Commands

#### CLI --version Command (Legacy)

- **CLI Option**: `--version [git|package]`
- **Default**: `package` (uses package.json version)
- **Arguments**:
  - `git`: Display Git version information (tag or commit hash)
  - `package`: Display package.json version (default)
- **Purpose**: CLI tool version information (maintained for backward compatibility)
- **Status**: ⚠️ **Legacy** - Consider using `cc-led info` for comprehensive information
- **Output Examples**:
  - `cc-led --version` → `v0.0.5-pre` (package.json version)
  - `cc-led --version package` → `v0.0.5-pre` (explicit package.json version)
  - `cc-led --version git` → `f35820e-dirty` (Git version: tag or commit hash)

#### cc-led info Command

- **CLI Command**: `cc-led info [options]`
- **Purpose**: Comprehensive project and version information management
- **Default Behavior**: Display all available information in human-readable format
- **Compatible with**: All development workflows, Arduino build process, CI/CD pipelines

**🎯 Command Options:**

| Option | Description | Output Example |
|--------|-------------|----------------|
| *(no options)* | Display all project information | Multi-line formatted output |
| `--version-git` | Git version information only | `f35820e-dirty` |
| `--version-package` | Package.json version only | `v0.0.5-pre` |
| `--build-flags` | Arduino build flags format | `-DFIRMWARE_VERSION=\"f35820e-dirty\" ...` |
| `--json` | JSON format output | `{"version":"f35820e-dirty", ...}` |
| `--board <board-id>` | Include board-specific information | Adds board context to output |

**📋 Usage Examples:**

```bash
# Comprehensive project information (default)
cc-led info
# → Project: cc-led
# → Package Version: v0.0.5-pre
# → Git Version: f35820e-dirty
# → Git Commit: f35820e
# → Git Branch: feature/mcp-integration
# → Build Date: 2025-09-14
# → Working Directory: Clean/Dirty

# Get specific version information
cc-led info --version-git        # → f35820e-dirty
cc-led info --version-package    # → v0.0.5-pre

# Arduino build integration
cc-led info --build-flags --board xiao-rp2040
# → -DFIRMWARE_VERSION=\"f35820e-dirty\" -DFIRMWARE_BOARD=\"xiao-rp2040\" ...

# JSON output for scripting
cc-led info --json
# → {"version":"f35820e-dirty","commit":"f35820e","tag":null,...}

# Board-specific information
cc-led info --board arduino-uno-r4
# → (includes board-specific context in output)
```

#### VERSION Command (Hardware)

- **CLI Option**: `--firmware-version`
- **Serial Output**: `VERSION\n`
- **Purpose**: Hardware version and capability detection
- **Response Format**: `VERSION,<version>,<board>,<firmware>,<buildDate>\n`
- **Usage Context**: CLI hardware version inquiry, MCP server discovery, diagnostic tools
- **Compatible Boards**: All supported boards

**CLI Usage Examples:**

```bash
# Get CLI tool version (default: package.json)
cc-led --version
# → v0.0.5-pre

# Get CLI tool version explicitly from package.json
cc-led --version package
# → v0.0.5-pre

# Get CLI tool version from Git (tag or commit)
cc-led --version git
# → f35820e-dirty

# Get hardware version information (firmware version)
cc-led led --port COM3 --firmware-version
# → Sent command: VERSION
# → Device response: VERSION,f35820e-dirty,xiao-rp2040,UniversalLedControl,2025-09-14
# → Hardware: xiao-rp2040 | Firmware: UniversalLedControl f35820e-dirty | Build: 2025-09-14

# Works on all supported boards
cc-led led --port COM5 --firmware-version  # Arduino Uno R4
# → Device response: VERSION,f35820e-dirty,arduino-uno-r4,SerialLedControl,2025-09-14
```

**Response Format:**

```bash
# Arduino response format
VERSION,<version>,<board>,<firmware>,<buildDate>\n

# Response components:
# - version: Firmware version (1.0.0)
# - board: Target board identifier (xiao-rp2040, arduino-uno-r4, etc.)  
# - firmware: Sketch name (UniversalLedControl, SerialLedControl, etc.)
# - buildDate: Compilation date (2025-01-13)
```

**Implementation Notes:**

- VERSION command available in both CLI and system-level usage
- Timeout handling: 2 seconds, returns "unknown" on no response
- CLI displays parsed hardware information in user-friendly format
- Board compatibility: All supported boards should respond
- Version information is injected at Arduino build time using Git tags/commits
- If Git tag exists: uses tag as version, otherwise uses commit hash format
- Build process automatically includes: version, board ID, firmware name, and build date

---

## 🔄 Command Priority Logic

When multiple options are specified simultaneously, commands follow this priority order:

### 🏆 Priority Hierarchy

| Priority | Command Type | Behavior |
|----------|--------------|----------|
| 1️⃣ **Highest** | `--firmware-version` | Hardware version inquiry (overrides all display commands) |
| 2️⃣ **High** | `--on` / `--off` | Power control overrides all LED display commands |
| 3️⃣ **Medium** | `--blink` | Blinking effects (BLINK1/BLINK2) |
| 4️⃣ **Low** | `--rainbow` | Rainbow effects |
| 5️⃣ **Lowest** | `--color` | Static color setting |

### 💡 Priority Examples

```bash
# Firmware version inquiry has highest priority
cc-led led --port COM3 --firmware-version --color red --blink blue
# → VERSION\n (firmware version takes priority)

# Power control wins over LED effects
cc-led led --port COM3 --on --color red --blink blue
# → ON\n (ON takes priority)

# Blink beats static color  
cc-led led --port COM3 --color red --blink green
# → BLINK1,0,255,0,500\n (blink takes priority)

# ON beats OFF when both specified
cc-led led --port COM3 --on --off
# → ON\n (ON takes priority)

# Rainbow beats static color
cc-led led --port COM3 --color purple --rainbow --interval 30
# → RAINBOW,30\n (rainbow takes priority)
```

---

## ✅ Input Validation

### 🎨 RGB Value Boundaries

| Value Type | Range | Valid Examples | Invalid Examples | Error Message |
|------------|-------|----------------|------------------|---------------|
| **RGB Integers** | 0-255 | `0,0,0` `255,255,255` `100,150,200` | `256,0,0` `-1,0,0` `1.5,0,0` | `Invalid color: {color}. RGB values must be between 0 and 255` |

**🔍 Boundary Testing:**

```bash
# ✅ Valid boundaries
cc-led led --port COM3 --color "0,0,0"         # Minimum values
cc-led led --port COM3 --color "255,255,255"   # Maximum values

# ❌ Invalid boundaries  
cc-led led --port COM3 --color "256,0,0"       # Over maximum
cc-led led --port COM3 --color "-1,0,0"        # Below minimum
cc-led led --port COM3 --color "1.5,0,0"       # Non-integer
```

### ⏱️ Interval Value Boundaries

| Parameter | Range | Valid Examples | Invalid Examples |
|-----------|-------|----------------|------------------|
| **Interval (ms)** | Positive integers | `1` `500` `10000` | `0` `-100` `1.5` |

**🔍 Interval Testing:**

```bash
# ✅ Valid intervals
cc-led led --port COM3 --blink --interval 1     # Minimum (very fast)
cc-led led --port COM3 --blink --interval 5000  # Large value (5 seconds)

# ❌ Invalid intervals
cc-led led --port COM3 --blink --interval 0     # Zero not allowed
cc-led led --port COM3 --blink --interval -100  # Negative not allowed
```

### 🌈 Color Format Validation

| Format | Valid ✅ | Invalid ❌ |
|--------|----------|------------|
| **Color Names** | `red` `RED` `blue` `green` | `invalid-color` `redd` `purple-ish` |
| **RGB Format** | `100,150,200` `255,0,0` | ` 100 , 150 , 200 ` (spaces) |
| **Component Count** | `r,g,b` (3 components) | `100,150` (2) `100,150,200,50` (4) |
| **Empty Values** | Any valid color | `""` (empty string) |

### 🔌 Required Parameters

| Parameter | Requirement | Error Condition | Error Message |
|-----------|-------------|-----------------|---------------|
| **Port** | Required | Empty/null/undefined | `Serial port is required` |  
| **Action** | Required | No command options | `No action specified` |

**💡 Parameter Validation Examples:**

```bash
# ❌ Missing required parameters
cc-led --color red                    # Missing port → Error
cc-led --port COM3                    # Missing action → Error

# ✅ Valid parameter combinations
cc-led --port COM3 --color red        # Both required parameters present
```

**🔗 Additional Validation Scenarios:**
For comprehensive boundary testing, command priority validation, and missing edge cases, see **[📊 Test Matrix](Test-Matrix.md)** which covers:

- Serial communication layer validation
- Complex command combinations  
- Error recovery mechanisms
- Performance and resource management tests

---

## 📡 Response Processing

### 📨 Response Formats

#### ✅ ACCEPTED Response (Success)

- **Format**: `ACCEPTED[,<command>[,<parameters>]]\n`
- **Meaning**: Command executed successfully
- **Case Sensitive**: Must be exact `ACCEPTED` (not `accepted` or `Accepted`)

**Examples:**

```text
ACCEPTED,ON
ACCEPTED,COLOR,255,0,0
ACCEPTED,BLINK1,0,255,0,interval=500
ACCEPTED,BLINK2,255,0,0,0,0,255,interval=750
ACCEPTED,RAINBOW,interval=100
```

#### ❌ REJECT Response (Error)

- **Format**: `REJECT,<command>,<error_message>\n`
- **Meaning**: Command failed with error
- **Case Sensitive**: Must be exact `REJECT` (not `reject` or `Reject`)

**Examples:**

```text
REJECT,COLOR,invalid format
REJECT,BLINK1,invalid parameters
REJECT,UNKNOWN,unknown command
REJECT,COLOR,Command failed: Invalid parameter count. Expected 3, got 1. Usage: COLOR,r,g,b
```

### 📱 Console Display Behavior

The CLI provides detailed feedback for all communication states:

#### ✅ Success Flow

1. **Send Notification**: `Sent command: <command>`
2. **Wait for Response**: Listen for microcontroller response
3. **Success Display**: `Device response: <response>`

**Example:**

```text
$ cc-led --port COM3 --color purple
Sent command: COLOR,255,0,255
Device response: ACCEPTED,COLOR,255,0,255
```

#### ❌ Error Flow

1. **Send Notification**: `Sent command: <command>`
2. **Error Reception**: Receive REJECT response from microcontroller
3. **Error Display**: `Device response: REJECT,<command>,<error>`

**Example:**

```text
$ cc-led --port COM3 --color invalid-color
Sent command: COLOR,invalid
Device response: REJECT,COLOR,invalid format
```

#### ⏰ Timeout Flow

1. **Send Notification**: `Sent command: <command>`
2. **No Response**: No response within timeout period
3. **Timeout Display**: `No response received from device (timeout)`

**Example:**

```text
$ cc-led --port COM3 --color red
Sent command: COLOR,255,0,0
No response received from device (timeout)
```

### 4.3 Response Processing Detailed Specifications

#### Response Reception Conditions

- Response must start with `ACCEPTED` or `REJECT`
- **Case Sensitive**: `accepted` or `Reject` are invalid
- Trailing newline characters (`\n`) are automatically trimmed

#### Timeout Settings

- **Production Environment**: 2000ms (2 seconds)
- **Test Environment** (`NODE_ENV=test`): 1ms
- Automatically cleanup listeners after timeout

#### Response Length Boundaries

- **Minimum**: `ACCEPTED` (8 characters)
- **Maximum**: No limit (can handle 1000+ character parameters)
- **Empty Response**: Treated as timeout

#### Special Character Processing

- **Multiple Commas**: `ACCEPTED,COLOR,255,0,0,extra,data,here` ✓
- **Special Characters**: `REJECT,ERROR,Invalid characters: @#$%^&*()` ✓
- **Unicode**: `ACCEPTED,INFO,Status：Success 🚀` ✓
- **Escaped Newlines**: `REJECT,ERROR,Line1\\nLine2\\nLine3` ✓

#### Invalid Response Examples

- `STATUS,OK,ready` (doesn't start with ACCEPTED/REJECT)
- `ACCEPTED_BUT_NOT_EXACT,ON` (not exact start)
- `` (empty string)
- `\t\n` (whitespace only)

---

## 🔄 Universal Protocol

### 🎯 Automatic Board Adaptation

The Universal LED Control Protocol automatically adapts commands for different board types:

- **RGB LEDs** (XIAO RP2040): Full color support with NeoPixel/WS2812 effects
- **Digital LEDs** (Arduino Uno R4, Raspberry Pi Pico): Commands converted to on/off equivalent
- **Same interface**: No board-specific commands needed

### 🔧 Board Firmware Adaptation

All color and effect conversions happen **inside the board firmware**:

| Command Type | RGB Board Behavior | Digital LED Board Behavior |
|--------------|-------------------|---------------------------|
| **COLOR,255,0,0** | Red color displayed | LED turns on (bright) |
| **BLINK1,0,255,0,500** | Green blink at 500ms | On/off blink at 500ms |
| **BLINK2,255,0,0,0,0,255,500** | Red/blue alternating blink | On/off blink at 500ms |
| **RAINBOW,100** | Rainbow color cycle | On/off blink at 100ms |

### 📡 Unified Command Interface

**📝 Examples - Same commands, different results:**

```bash
# Same command works on all boards
cc-led --color red -p COM3        # XIAO RP2040: Red light
cc-led --color red -p COM5        # Arduino Uno R4: LED on

cc-led --rainbow -p COM3           # XIAO RP2040: Rainbow effect  
cc-led --rainbow -p COM5           # Arduino Uno R4: Blink effect
```

---

## ❌ Error Handling

### 🚫 Command Send Errors

| Error Type | Error Message | Cause |
|------------|---------------|-------|
| **Serial Port Write Failure** | `Failed to send command: <error>` | Hardware disconnection, port busy |
| **Connection Error** | `Serial port is not open. Call connect() first.` | Command sent before port opened |

### 🧹 Resource Management

- **Automatic Cleanup**: Data listeners removed after response reception
- **Timeout Cleanup**: Listeners and timers properly cleaned up on timeout
- **Memory Management**: No memory leaks from pending listeners

**🔧 Error Recovery Examples:**

```bash
# Common error scenarios and handling
cc-led --port INVALID_PORT --color red    # → Connection error
cc-led --port COM3 --color invalid        # → Color validation error
# Device unplugged during command         # → Timeout error
```

---

## ⚡ Performance

### ⏱️ Execution Speed Benchmarks

| Environment | Response Processing | Timeout Period | Command Sending |
|-------------|--------------------| --------------|-----------------|
| **Test Environment** | < 20ms | 1ms | Synchronous (0ms) |
| **Production Environment** | < 50ms | 2000ms (2 seconds) | Synchronous (0ms) |

### 🔄 Concurrency Support

- **Parallel Processing**: Multiple controller instances can run simultaneously
- **Independent Connections**: Each instance manages separate serial connections
- **Thread Safety**: No shared state between controller instances

**📊 Performance Examples:**

```bash
# Fast response in test environment
NODE_ENV=test cc-led --port COM3 --color red     # → ~18ms total

# Normal response in production
cc-led --port COM3 --color red                   # → ~45ms total

# Multiple boards simultaneously (in different terminals)
cc-led --port COM3 --color red &                 # Board 1
cc-led --port COM5 --color blue &                # Board 2
```

---

## 🔧 Integration Examples

### ✅ Success Case Flow

**Command:**

```bash
cc-led --port COM3 --color purple
```

**📋 Step-by-Step Processing:**

1. **CLI Parsing**: `{ port: 'COM3', color: 'purple' }`
2. **Color Conversion**: `purple` → `255,0,255`
3. **Command Generation**: `COLOR,255,0,255`
4. **Serial Transmission**: `COLOR,255,0,255\n`
5. **Console Output**: `Sent command: COLOR,255,0,255`
6. **Response Reception**: `ACCEPTED,COLOR,255,0,255`
7. **Console Output**: `Device response: ACCEPTED,COLOR,255,0,255`

**🎯 Result**: LED displays purple color

### ❌ Error Case Flow  

**Command:**

```bash
cc-led --port COM3 --color invalid-color
```

**📋 Step-by-Step Processing:**

1. **CLI Parsing**: `{ port: 'COM3', color: 'invalid-color' }`
2. **Color Validation**: Error detected during validation
3. **Exception Thrown**: `Invalid color: invalid-color`
4. **Process Termination**: CLI exits with error message

**🎯 Result**: No command sent, process exits with error

### ⏰ Timeout Case Flow

**Command:**

```bash  
cc-led --port COM3 --color red
```

**📋 Step-by-Step Processing:**

1. **CLI Parsing**: `{ port: 'COM3', color: 'red' }`
2. **Color Conversion**: `red` → `255,0,0`
3. **Command Generation**: `COLOR,255,0,0`
4. **Serial Transmission**: `COLOR,255,0,0\n`
5. **Console Output**: `Sent command: COLOR,255,0,0`
6. **No Response**: Device doesn't respond within timeout
7. **Timeout Handling**: Cleanup listeners and timers
8. **Console Output**: `No response received from device (timeout)`

**🎯 Result**: Command sent but no confirmation received

---

## 📚 Related Documentation

### 🔗 Core Documentation

- **[📖 README.md](../README.md)** - Project overview and quick start guide
- **[🔧 CONTRIBUTING.md](CONTRIBUTING.md)** - Adding new boards and sketches
- **[🎨 CLAUDE_CODE_HOOKS.md](CLAUDE_CODE_HOOKS.md)** - Claude Code integration examples
- **[📋 GIT-VERSION-INTEGRATION.md](GIT-VERSION-INTEGRATION.md)** - Git version information integration (now handled by `cc-led info`)

### 🧪 Testing Documentation  

- **[📊 Test Matrix](Test-Matrix.md)** - Comprehensive test scenarios and validation matrix
- **Test Files**: Located in `/test/` directory with comprehensive coverage:
  - `cli-*.test.js` - CLI command mapping tests
  - `response-*.test.js` - Response processing tests
  - `__tests__/helpers/` - Shared test utilities

### 💻 Implementation Reference

- **[🎛️ controller.js](../src/controller.js)** - Core protocol implementation
- **[📋 cli-service.js](../src/cli-service.js)** - CLI service with `info` command implementation
- **[📋 Board Configurations](../sketches/)** - Board-specific settings and sketches

### 🔧 Tools & Development

- **[📋 Vitest Configuration](../vitest.config.js)** - Test framework settings
- **[📦 Package Configuration](../package.json)** - Dependencies and scripts

---

## 📄 Document Information

| Field | Value |
|-------|--------|
| **Version** | 0.0.5-pre |
| **Last Updated** | 2025-09-14 |
| **Scope** | CLI option processing, serial communication protocol, response processing, info command |
| **Test Coverage** | ✅ Comprehensive test suite with 100% scenario coverage |
| **Validation Status** | ✅ Verified against implementation in `src/controller.js` and `src/cli-service.js` |
| **Recent Changes** | Added `cc-led info` command, marked `--version` as legacy, improved version management |

---

**🌟 Need Help?**

- [📋 Open an Issue](https://github.com/ShortArrow/cc-led/issues) for questions or bug reports
- [🔧 Contributing Guide](CONTRIBUTING.md) for development setup
- [🎨 Claude Code Hooks](CLAUDE_CODE_HOOKS.md) for integration examples

---

*Built with ❤️ for Arduino LED control and Claude Code integration*
