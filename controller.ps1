<#
.SYNOPSIS
    Controls the color and effects of a XIAO RP2040's NeoPixel LED.
.DESCRIPTION
    This script sends commands over a serial port to a pre-programmed XIAO RP2040
    to control its onboard WS2812 LED. You can set colors, create blinking effects,
    and activate a rainbow cycle.
.PARAMETER Port
    The COM port of the XIAO RP2040. Defaults to 'COM6'.
.PARAMETER On
    Turns the LED on to a solid white color.
.PARAMETER Off
    Turns the LED off.
.PARAMETER Color
    Sets a solid color. Choose from predefined colors or specify a custom RGB value with CustomColor.
.PARAMETER CustomColor
    Specifies a custom color in "R,G,B" format (e.g., "255,100,0"). Used when -Color is 'Custom'.
.PARAMETER Blink
    Enables blinking mode. Must be used with -Color and -Interval.
.PARAMETER BlinkType
    Specifies the type of blink: 'ONOFF' for on/off blinking, or '2Color' for blinking between two colors.
.PARAMETER SecondColor
    The second color for '2Color' blink type.
.PARAMETER CustomSecondColor
    The custom RGB value for the second color in "R,G,B" format.
.PARAMETER Interval
    The interval for blinking or rainbow cycle speed in milliseconds. Defaults to 500.
.PARAMETER Rainbow
    Activates a continuous rainbow color cycle effect.
.EXAMPLE
    # Set the LED to solid red
    .\controller.ps1 -Color Red

.EXAMPLE
    # Turn the LED off
    .\controller.ps1 -Off

.EXAMPLE
    # Blink green on and off every 200ms
    .\controller.ps1 -Blink -Color Green -Interval 200

.EXAMPLE
    # Blink between red and a custom orange color every second
    .\controller.ps1 -Blink -BlinkType 2Color -Color Red -CustomSecondColor "255,165,0" -Interval 1000

.EXAMPLE
    # Start a fast rainbow cycle
    .\controller.ps1 -Rainbow -Interval 10
#>
param(
    [string]$Port = 'COM6',
    [switch]$On,
    [switch]$Off,
    [ValidateSet('Red', 'Green', 'Blue', 'Yellow', 'Purple', 'Cyan', 'White', 'Custom')]
    [string]$Color,
    [string]$CustomColor,
    [switch]$Blink,
    [ValidateSet('ONOFF', '2Color')]
    [string]$BlinkType = 'ONOFF',
    [ValidateSet('Red', 'Green', 'Blue', 'Yellow', 'Purple', 'Cyan', 'White', 'Custom')]
    [string]$SecondColor,
    [string]$CustomSecondColor,
    [int]$Interval = 500,
    [switch]$Rainbow
    # EffectDuration is not implemented as the effect runs continuously on the board
    # until a new command is sent.
)

function Get-RgbString {
    param([string]$ColorName, [string]$CustomRgb)
    switch ($ColorName) {
        'Red'    { return "255,0,0" }
        'Green'  { return "0,255,0" }
        'Blue'   { return "0,0,255" }
        'Yellow' { return "255,255,0" }
        'Purple' { return "255,0,255" }
        'Cyan'   { return "0,255,255" }
        'White'  { return "255,255,255" }
        'Custom' {
            if (-not ([string]::IsNullOrWhiteSpace($CustomRgb))) {
                return $CustomRgb
            } else {
                throw "CustomColor must be provided when Color is 'Custom'."
            }
        }
        default { return "0,0,0" }
    }
}

$command = ""

if ($On) {
    $command = "ON"
}
elseif ($Off) {
    $command = "OFF"
}
elseif ($Rainbow) {
    $command = "RAINBOW,$Interval"
}
elseif ($Color) {
    $rgb1 = Get-RgbString -ColorName $Color -CustomRgb $CustomColor
    if ($Blink) {
        if ($BlinkType -eq 'ONOFF') {
            $command = "BLINK1,$rgb1,$Interval"
        }
        else { # 2Color
            if (-not $SecondColor) { throw "SecondColor must be specified for BlinkType '2Color'." }
            $rgb2 = Get-RgbString -ColorName $SecondColor -CustomRgb $CustomSecondColor
            $command = "BLINK2,$rgb1,$rgb2,$Interval"
        }
    }
    else {
        $command = "COLOR,$rgb1"
    }
}
else {
    Write-Output "No action specified. Use -On, -Off, -Color, or -Rainbow. Use -Help for more details."
    return
}

$serialPort = New-Object System.IO.Ports.SerialPort
$serialPort.PortName = $Port
$serialPort.BaudRate = 9600

try {
    $serialPort.Open()
    Write-Output "Sending command: $command"
    $serialPort.WriteLine($command)
}
catch {
    Write-Error "Failed to send command. Error: $_"
    Write-Error "Please check if the COM port '$Port' is correct and not in use."
}
finally {
    if ($serialPort.IsOpen) {
        $serialPort.Close()
    }
}
