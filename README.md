# XIAO RP2040 NeoPixel Controller

This project allows controlling the onboard NeoPixel (WS2812) LED on a Seeed Studio XIAO RP2040 using a PowerShell script.

## Prerequisites

- [Arduino CLI](https://arduino.github.io/arduino-cli/latest/) installed and in your system's PATH.
- A XIAO RP2040 board.
- PowerShell.

## Setup

### Linux Setup

📅 W.I.P. - This section is a work in progress.

### Windows Setup

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

Use the `controller.ps1` script from a PowerShell terminal to control the LED.

### Examples

📅 W.I.P. - This section is a work in progress. nodejs implementation is not yet complete.

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

### Changing the COM Port

The default port is `COM6`. If your board is on a different port, use the `-Port` parameter.

```powershell
.\controller.ps1 -Port COM7 -Color Red
```

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
