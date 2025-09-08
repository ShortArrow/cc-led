# Claude Code Hooks Setup

This guide explains how to set up LED notifications for Claude Code events using your Arduino board. Get visual feedback for different AI agent states!

## 🎯 What are Claude Code Hooks?

Claude Code hooks allow you to run custom commands when specific events occur, such as:

- **Stop**: Agent stops or completes a task
- **Notification**: Important notifications
- **PostToolUse**: After using tools like Bash, Read, Edit, etc.
- **UserPromptSubmit**: When you submit a prompt

With cc-led, you can get LED notifications for these events!

## 📋 Prerequisites

### Hardware

- Supported Arduino board (e.g., Seeed Studio XIAO RP2040)
- USB cable for board connection

### Software

- [Claude Code](https://claude.ai/code) with hooks support
- cc-led CLI installed and working (`npm install -g cc-led` or use `npx`)
- Board with LED control sketch uploaded

## 🚀 Quick Setup

### Step 1: Upload LED Control Sketch

First, upload a sketch that can respond to LED commands:

```bash
# Install dependencies for your board
cc-led --board xiao-rp2040 install

# Upload the LED control sketch
cc-led --board xiao-rp2040 upload NeoPixel_SerialControl -p COM3
```

### Step 2: Test LED Control

Verify your LED control works:

```bash
# Test basic colors
cc-led --board xiao-rp2040 led --color red -p COM3
cc-led --board xiao-rp2040 led --color green -p COM3
cc-led --board xiao-rp2040 led --off -p COM3
```

### Step 3: Configure Claude Code Hooks

Add the following to your Claude Code `settings.json`:

## 🔧 Hook Configuration

### Option 1: Global Installation (Recommended)

If you installed with `npm install -g cc-led`:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "cc-led --board xiao-rp2040 led --color blue -p COM3"
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
            "command": "cc-led --board xiao-rp2040 led --blink --color yellow --interval 500 -p COM3"
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
            "command": "cc-led --board xiao-rp2040 led --color green -p COM3"
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
            "command": "cc-led --board xiao-rp2040 led --color purple -p COM3"
          }
        ]
      }
    ]
  }
}
```

### Option 2: Using npx (Alternative)

If you prefer not to install globally, use `npx`:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "npx cc-led --board xiao-rp2040 led --color blue -p COM3"
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
            "command": "npx cc-led --board xiao-rp2040 led --color green -p COM3"
          }
        ]
      }
    ]
  }
}
```

### Legacy PowerShell Configuration

For users still using the original PowerShell scripts, see **[LEGACY.md](LEGACY.md#legacy-claude-code-hooks-configuration)** for hook configuration examples.

## 🎨 Customization Ideas

### Event-Specific Colors

- **Stop**: Blue (task completed)
- **Error**: Red blinking (something went wrong)
- **Success**: Green (operation succeeded)  
- **Working**: Yellow blinking (processing)
- **User Input**: Purple (waiting for user)

### Advanced Effects

```bash
# Rainbow effect for notifications
cc-led --board xiao-rp2040 led --rainbow --interval 50 -p COM3

# Two-color blinking for errors
cc-led --board xiao-rp2040 led --blink --color red --second-color white --interval 200 -p COM3

# Solid colors for states
cc-led --board xiao-rp2040 led --color "255,128,0" -p COM3  # Custom orange
```

### Board-Specific Examples

#### XIAO RP2040 (RGB LED)

```json
{
  "type": "command",
  "command": "cc-led --board xiao-rp2040 led --rainbow --interval 30 -p COM3"
}
```

#### Arduino Uno R4 (Single LED)

```json
{
  "type": "command", 
  "command": "cc-led --board arduino-uno-r4 led --blink --interval 500 -p COM5"
}
```

#### Raspberry Pi Pico (Single LED)

```json
{
  "type": "command",
  "command": "cc-led --board raspberry-pi-pico led --on -p /dev/ttyACM0"
}
```

## 🔧 Configuration Tips

### Environment Variables

Set your port once to avoid repeating `-p` flag:

```bash
# Windows
set SERIAL_PORT=COM3

# Linux/Mac  
export SERIAL_PORT=/dev/ttyACM0
```

Or create a `.env` file in your project root:

```
SERIAL_PORT=COM3
```

### Finding Your Settings File

Claude Code settings location:

- **Windows**: `%APPDATA%\Claude\claude-code\settings.json`
- **Mac**: `~/Library/Application Support/Claude/claude-code/settings.json`
- **Linux**: `~/.config/Claude/claude-code/settings.json`

### Testing Your Configuration

Test hooks by running Claude Code commands and watching your LED!

## 🐛 Troubleshooting

### LED Not Responding

1. **Check Board Connection**:

   ```bash
   cc-led boards  # Should show your board
   ```

2. **Test Direct Control**:

   ```bash
   cc-led --board your-board led --color red -p YOUR_PORT
   ```

3. **Verify Sketch Upload**:

   ```bash
   cc-led --board your-board upload NeoPixel_SerialControl -p YOUR_PORT
   ```

### Hook Not Triggering

1. **Check Settings Syntax**: Ensure JSON is valid
2. **Check Command Path**: Use full paths if needed
3. **Test Command Manually**: Run the hook command directly

### Port Issues

1. **Windows**: Check Device Manager for COM port
2. **Linux**: Check `ls /dev/tty*` and user permissions
3. **Mac**: Check `ls /dev/tty.*`

### Permission Issues (Linux/Mac)

```bash
# Add user to dialout group (logout/login required)
sudo usermod -a -G dialout $USER
```

## 🌟 Advanced Hook Patterns

### Conditional Hooks

```json
{
  "PostToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        {
          "type": "command",
          "command": "cc-led led --color orange -p COM3"
        }
      ]
    },
    {
      "matcher": "Read|Write|Edit",
      "hooks": [
        {
          "type": "command", 
          "command": "cc-led led --color cyan -p COM3"
        }
      ]
    }
  ]
}
```

### Multiple Board Support

```json
{
  "Stop": [
    {
      "matcher": "",
      "hooks": [
        {
          "type": "command",
          "command": "cc-led --board xiao-rp2040 led --color blue -p COM3"
        },
        {
          "type": "command",
          "command": "cc-led --board arduino-uno-r4 led --blink -p COM5"
        }
      ]
    }
  ]
}
```

## 📚 Available LED Commands

For complete command reference, see:

```bash
cc-led led --help
cc-led --board your-board led --help
```

Common patterns:

- `--on`, `--off`: Simple on/off
- `--color red`: Solid colors  
- `--blink --interval 500`: Blinking
- `--rainbow --interval 50`: Rainbow effect (RGB boards)
- `--color red --second-color blue`: Two-color blink

## 💡 Creative Ideas

- **Different colors for different projects**: Change LED colors based on the directory you're in
- **Intensity levels**: Bright colors for errors, dim for success
- **Sequence patterns**: Multiple quick blinks for different event types
- **Time-based colors**: Different colors for day/night coding sessions

---

Enjoy your LED-enhanced Claude Code experience! 🌈✨
