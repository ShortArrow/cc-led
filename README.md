# XIAO RP2040 NeoPixel Controller

This project allows controlling the onboard NeoPixel (WS2812) LED on a Seeed Studio XIAO RP2040 using a PowerShell script.

## Prerequisites

- [Arduino CLI](https://arduino.github.io/arduino-cli/latest/) installed and in your system's PATH.
- A XIAO RP2040 board.
- PowerShell.

## Setup

1. **Initialize the Environment:**
    The first time you use this project, you need to set up the `arduino-cli` environment. The necessary board definitions and libraries will be installed locally within the project directory.
    *(This setup has already been completed).*

2. **Upload the Sketch:**
    The Arduino sketch `NeoPixel_SerialControl/NeoPixel_SerialControl.ino` must be uploaded to the board. This sketch listens for commands over the serial port.

    ```powershell
    # Compile the sketch
    arduino-cli compile --fqbn rp2040:rp2040:seeed_xiao_rp2040 NeoPixel_SerialControl --config-file arduino-cli.yaml

    # Upload the sketch (replace COM6 if necessary)
    arduino-cli upload -p COM6 --fqbn rp2040:rp2040:seeed_xiao_rp2040 NeoPixel_SerialControl --config-file arduino-cli.yaml
    ```

## Usage

Use the `controller.ps1` script from a PowerShell terminal to control the LED.

### Examples

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
