# compile.ps1
# Description: Compiles a given Arduino sketch for the Seeed XIAO RP2040.

param (
    [Parameter(Mandatory = $true, HelpMessage = "The name of the sketch directory to compile (e.g., 'LEDBlink').")]
    [string]$SketchName
)

# Exit immediately if a command exits with a non-zero status.
$ErrorActionPreference = "Stop"

# Fully Qualified Board Name (FQBN) for Seeed XIAO RP2040
$fqbn = "rp2040:rp2040:seeed_xiao_rp2040"
$sketchDir = ".\$SketchName"

try {
    if (-not (Test-Path -Path $sketchDir -PathType Container)) {
        throw "Sketch directory '$sketchDir' not found."
    }

    Write-Host "Compiling sketch '$SketchName' for board '$fqbn'..."
    arduino-cli --config-file ./arduino-cli.yaml compile --fqbn $fqbn $sketchDir

    Write-Host "Compilation successful. Output files are in '$sketchDir\build'."

}
catch {
    Write-Error "An error occurred during compilation: $_"
    exit 1
}

