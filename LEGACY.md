# Legacy PowerShell Setup

> **⚠️ Legacy Documentation**: This setup method is deprecated. For new users, please use the [modern CLI setup](README.md) instead.

This document describes the original PowerShell-based setup method for cc-led, kept for reference and existing users.

## PowerShell Setup (Legacy)

### Prerequisites

- PowerShell 7
- [Arduino CLI](https://arduino.github.io/arduino-cli/latest/) installed and in your system's PATH
- XIAO RP2040 board

### Installation

1. **Install Board Cores and Libraries:**
   Run the `install.ps1` script to download and install the required board definitions and libraries. This only needs to be done once.

   ```powershell
   pwsh -nop -f ./legacy/install.ps1
   ```

2. **Upload the Sketch:**
   Use the `deploy.ps1` script to upload the `NeoPixel_SerialControl` sketch to your board. You must provide the sketch name and the correct COM port for your XIAO RP2040.

   ```powershell
   pwsh -nop -f ./legacy/deploy.ps1 -SketchName NeoPixel_SerialControl -Port COM6
   ```

3. **(Optional) Compile a Sketch:**
   If you only want to compile a sketch to check for errors without uploading, you can use the `compile.ps1` script.

   ```powershell
   pwsh -nop -f ./legacy/compile.ps1 -SketchName NeoPixel_SerialControl
   ```

## Legacy PowerShell Usage

### LED Control Examples

- **Turn LED On (Solid White)**

```powershell
.\legacy\controller.ps1 -On
```

- **Turn LED Off**

```powershell
.\legacy\controller.ps1 -Off
```

- **Set a Solid Color**
  - Available colors: `Red`, `Green`, `Blue`, `Yellow`, `Purple`, `Cyan`, `White`.

```powershell
.\legacy\controller.ps1 -Color Red
```

- **Set a Custom Color (e.g., Orange)**

```powershell
.\legacy\controller.ps1 -Color Custom -CustomColor "255,165,0"
```

- **Simple Blink (On/Off)**

This blinks green on and off every 200 milliseconds.

```powershell
.\legacy\controller.ps1 -Blink -Color Green -Interval 200
```

- **Two-Color Blink**

This blinks between blue and yellow every second.

```powershell
.\legacy\controller.ps1 -Blink -BlinkType 2Color -Color Blue -SecondColor Yellow -Interval 1000
```

- **Rainbow Effect**

This cycles through all colors of the rainbow. You can optionally control the speed with `-Interval`.

```powershell
.\legacy\controller.ps1 -Rainbow -Interval 20
```

## Legacy Claude Code Hooks Configuration

If you're using the legacy PowerShell scripts with Claude Code hooks:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "pwsh.exe -nol -nop -f V:/cc-led/legacy/controller.ps1 -Color Blue"
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
            "command": "pwsh.exe -nol -nop -f V:/cc-led/legacy/controller.ps1 -Blink -Color Yellow -Interval 500"
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
            "command": "pwsh.exe -nol -nop -f V:/cc-led/legacy/controller.ps1 -Color Green"
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
            "command": "pwsh.exe -nol -nop -f V:/cc-led/legacy/controller.ps1 -Color Purple"
          }
        ]
      }
    ]
  }
}
```

## Migration to Modern CLI

To migrate from PowerShell scripts to the modern CLI:

1. **Install the CLI**:
   ```bash
   # Global installation (recommended)
   npm install -g @cc-led/cli
   
   # Or for development
   npm install
   npm link
   ```

2. **Replace PowerShell commands**:
   ```bash
   # Old: .\legacy\controller.ps1 -Color Red
   # New: cc-led --board xiao-rp2040 led --color red -p COM3
   
   # Or with npx (no installation needed)
   # npx @cc-led/cli --board xiao-rp2040 led --color red -p COM3
   ```

3. **Update Claude Code hooks** to use the new CLI commands (see [CLAUDE_CODE_HOOKS.md](CLAUDE_CODE_HOOKS.md))

## Why the CLI is Better

- **Multi-board support**: Not limited to XIAO RP2040
- **Cross-platform**: Works on Windows, Linux, macOS
- **Better error handling**: Clear error messages and validation
- **Future-proof**: Active development and new features
- **Global installation**: Install once, use anywhere with `npm install -g`
- **NPX support**: Use without installation via `npx @cc-led/cli`

---

**💡 Recommendation**: Migrate to the [modern CLI setup](README.md) for better experience and ongoing support.