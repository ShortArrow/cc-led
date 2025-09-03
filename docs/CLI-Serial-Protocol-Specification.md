# CLI-Serial Protocol Specification

## Overview

This document details the causal relationship between CLI options and serial commands in the cc-led CLI tool, as well as response processing from microcontrollers.

## 1. CLI Options to Serial Commands Mapping

### 1.1 Basic Control Commands

#### ON Command

- **CLI Option**: `--on`
- **Generated Serial Command**: `ON\n`
- **Behavior**: Turn on LED with last used color or default color

#### OFF Command  

- **CLI Option**: `--off`
- **Generated Serial Command**: `OFF\n`
- **Behavior**: Turn off LED completely

### 1.2 Color Commands

#### Static Color Setting

- **CLI Option**: `--color <color>`
- **Generated Serial Command**: `COLOR,<r>,<g>,<b>\n`

**Supported Color Formats:**

- **Color Names**: `red`, `green`, `blue`, `yellow`, `purple`, `cyan`, `white`
- **RGB Values**: `255,0,0` (comma-separated integers, 0-255)
- **Case Insensitive**: `RED` = `red`

**Examples:**

- `--color red` → `COLOR,255,0,0\n`
- `--color blue` → `COLOR,0,0,255\n`
- `--color "100,150,200"` → `COLOR,100,150,200\n`

### 1.3 Blink Commands

#### Single Color Blink (BLINK1)

- **CLI Option**: `--blink [color] [--interval <ms>]`
- **Generated Serial Command**: `BLINK1,<r>,<g>,<b>,<interval>\n`
- **Defaults**: color=white, interval=500ms

**Examples:**

- `--blink` → `BLINK1,255,255,255,500\n` (white, 500ms)
- `--blink red --interval 1000` → `BLINK1,255,0,0,1000\n`
- `--blink --color blue --interval 200` → `BLINK1,0,0,255,200\n`

#### Two Color Blink (BLINK2)

- **CLI Option**: `--blink <color1> --second-color <color2> [--interval <ms>]`
- **Generated Serial Command**: `BLINK2,<r1>,<g1>,<b1>,<r2>,<g2>,<b2>,<interval>\n`

**Example:**

- `--blink red --second-color blue --interval 750` → `BLINK2,255,0,0,0,0,255,750\n`

### 1.4 Rainbow Effect Commands

#### Rainbow Effect

- **CLI Option**: `--rainbow [--interval <ms>]`
- **Generated Serial Command**: `RAINBOW,<interval>\n`
- **Default**: interval=50ms

**Examples:**

- `--rainbow` → `RAINBOW,50\n`
- `--rainbow --interval 100` → `RAINBOW,100\n`

## 2. Command Priority Logic

Priority order when multiple options are specified simultaneously:

1. **ON/OFF** (highest priority)
2. **BLINK** (blinking effects)
3. **RAINBOW** (rainbow effects)
4. **COLOR** (static color, lowest priority)

### Priority Examples

- `--on --color red --blink blue` → `ON\n` (ON takes priority)
- `--color red --blink green` → `BLINK1,0,255,0,500\n` (blink takes priority)
- `--on --off` → `ON\n` (ON takes priority)

## 3. Input Validation and Boundary Values

### 3.1 RGB Value Boundaries

- **Valid Range**: 0-255 (integers)
- **Minimum**: `0,0,0` ✓
- **Maximum**: `255,255,255` ✓
- **Invalid Values**:
  - `256,0,0` → Error
  - `-1,0,0` → Error
  - `1.5,0,0` → Error

### 3.2 Interval Value Boundaries

- **Valid Range**: Positive integers (milliseconds)
- **Minimum**: `1` ✓
- **Large Values**: `10000` ✓
- **Zero Value**: `0` (allowed, instant switching)

### 3.3 Color Format Validation

- **Valid**: `red`, `RED`, `100,150,200`
- **Invalid**:
  - `invalid-color` → Error
  - ` 100 , 150 , 200 ` (with spaces) → Error
  - `100,150` (insufficient components) → Error
  - `100,150,200,50` (too many components) → Error
  - `` (empty string) → Error

### 3.4 Required Parameter Validation

- **Port Specification**: Required
  - `port: ''` → Error
  - `port: null/undefined` → Error
- **Action Specification**: Required
  - No options → `No action specified` error

## 4. Microcontroller Response Processing

### 4.1 Response Formats

#### ACCEPTED Response (Success)

**Format**: `ACCEPTED[,<command>[,<parameters>]]\n`

**Examples:**

- `ACCEPTED,ON\n`
- `ACCEPTED,COLOR,255,0,0\n`
- `ACCEPTED,BLINK1,0,255,0,interval=500\n`
- `ACCEPTED,BLINK2,255,0,0,0,0,255,interval=750\n`
- `ACCEPTED,RAINBOW,interval=100\n`

#### REJECT Response (Error)

**Format**: `REJECT,<command>,<error_message>\n`

**Examples:**

- `REJECT,COLOR,invalid format\n`
- `REJECT,BLINK1,invalid parameters\n`
- `REJECT,UNKNOWN,unknown command\n`

### 4.2 Response Display Behavior

#### Success Flow

1. Output `Sent command: <command>` to console
2. Wait for microcontroller response
3. Output `Device response: <response>` to console

**Example:**

```text
Sent command: COLOR,255,0,255
Device response: ACCEPTED,COLOR,255,0,255
```

#### Error Flow

1. Output `Sent command: <command>` to console
2. Receive error response from microcontroller
3. Output `Device response: REJECT,<command>,<error>` to console

**Example:**

```text
Sent command: COLOR,invalid
Device response: REJECT,COLOR,invalid format
```

#### Timeout Flow

1. Output `Sent command: <command>` to console
2. No response within specified time
3. Output `No response received from device (timeout)` to console

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

## 5. Digital LED Protocol (Arduino Uno R4)

### 5.1 Protocol Detection

- When `board.getLedProtocol()` returns `'Digital'`
- Digital LEDs don't support colors but use the same command interface

### 5.2 Color Warning Messages

- **Color Setting**: `Note: Digital LED does not support colors. Color '<color>' ignored, turning LED on.`
- **Color Blink**: `Note: Digital LED does not support colors. Color '<color>' ignored, blinking LED.`
- **Two Color Blink**: `Note: Digital LED does not support multi-color blinking. Colors '<color1>' and '<color2>' ignored, using single-color blink.`
- **Rainbow**: `Note: Digital LED does not support rainbow effect. Using simple blink instead.`

### 5.3 White Color Exception

- No warning displayed when `white` is specified (treated as default color)

## 6. Error Handling

### 6.1 Command Send Errors

- Serial port write failure: `Failed to send command: <error>`
- Command execution before connection: `Serial port is not open. Call connect() first.`

### 6.2 Listener Management

- Automatically remove data listeners after response reception
- Properly cleanup listeners and timers on timeout

## 7. Performance Characteristics

### 7.1 Execution Speed

- **Response Processing**: < 20ms (test environment)
- **Immediate Response**: < 50ms (production environment)
- **Command Sending**: Synchronous, no delay

### 7.2 Parallel Processing

- Multiple controller instances can run in parallel
- Each instance manages independent serial connections

## 8. Integration Flow Examples

### 8.1 Success Case

```bash
cc-led --port COM3 --color purple
```

**Processing Flow:**

1. CLI parsing: `{ port: 'COM3', color: 'purple' }`
2. Color conversion: `purple` → `255,0,255`
3. Command generation: `COLOR,255,0,255`
4. Serial transmission: `COLOR,255,0,255\n`
5. Console output: `Sent command: COLOR,255,0,255`
6. Response reception: `ACCEPTED,COLOR,255,0,255`
7. Console output: `Device response: ACCEPTED,COLOR,255,0,255`

### 8.2 Error Case

```bash
cc-led --port COM3 --color invalid-color
```

**Processing Flow:**

1. CLI parsing: `{ port: 'COM3', color: 'invalid-color' }`
2. Color conversion: Error detection
3. Exception thrown: `Invalid color: invalid-color`
4. Process termination

---

**Version**: 0.0.4-pre  
**Last Updated**: 2025-09-03  
**Scope**: CLI option processing, serial communication protocol, response processing
