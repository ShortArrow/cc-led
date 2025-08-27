# deploy.ps1
# Description: Uploads a given Arduino sketch to the Seeed XIAO RP2040.

param (
    [Parameter(Mandatory = $true, HelpMessage = "The name of the sketch directory to upload (e.g., 'LEDBlink').")]
    [string]$SketchName,
    [Parameter(HelpMessage = "The serial port your XIAO RP2040 is connected to (e.g., 'COM3' on Windows, '/dev/ttyUSB0' on Linux).")]
    [string]$Port
)

# Exit immediately if a command exits with a non-zero status.
$ErrorActionPreference = "Stop"

# Load environment variables from .env file if Port is not provided
if (-not $Port) {
    $envFile = Join-Path $PSScriptRoot ".env"
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match "^\s*([^#][^=]+)=(.+)$") {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                if ($key -eq "SERIAL_PORT") {
                    $Port = $value
                }
            }
        }
    }
    # If still no port, throw error
    if (-not $Port) {
        throw "Port parameter is required. Specify it directly or set SERIAL_PORT in .env file."
    }
}

# Fully Qualified Board Name (FQBN) for Seeed XIAO RP2040
$fqbn = "rp2040:rp2040:seeed_xiao_rp2040"
$sketchDir = ".\$SketchName"

try {
    if (-not (Test-Path -Path $sketchDir -PathType Container)) {
        throw "Sketch directory '$sketchDir' not found."
    }

    Write-Host "Uploading sketch '$SketchName' to board '$fqbn' on port '$Port'..."
    # The 'upload' command automatically compiles the sketch before uploading.
    arduino-cli --config-file ./arduino-cli.yaml upload --port $Port --fqbn $fqbn $sketchDir

    Write-Host "Upload successful."

}
catch {
    Write-Error "An error occurred during upload: $_"
    exit 1
}
