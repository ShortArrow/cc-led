# deploy.ps1
# Description: Uploads a given Arduino sketch to the Seeed XIAO RP2040.

param (
    [Parameter(Mandatory = $true, HelpMessage = "The name of the sketch directory to upload (e.g., 'LEDBlink').")]
    [string]$SketchName,
    [Parameter(Mandatory = $true, HelpMessage = "The COM port your XIAO RP2040 is connected to (e.g., 'COM3').")]
    [string]$Port
)

# Exit immediately if a command exits with a non-zero status.
$ErrorActionPreference = "Stop"

# Fully Qualified Board Name (FQBN) for Seeed XIAO RP2040
$fqbn = "seeed:rp2040:seeed_xiao_rp2040"
$sketchDir = ".\$SketchName"

try {
    if (-not (Test-Path -Path $sketchDir -PathType Container)) {
        throw "Sketch directory '$sketchDir' not found."
    }

    Write-Host "Uploading sketch '$SketchName' to board '$fqbn' on port '$Port'..."
    # The 'upload' command automatically compiles the sketch before uploading.
    arduino-cli upload --port $Port --fqbn $fqbn $sketchDir

    Write-Host "Upload successful."

}
catch {
    Write-Error "An error occurred during upload: $_"
    exit 1
}
