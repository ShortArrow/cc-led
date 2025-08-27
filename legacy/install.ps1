# install.ps1
# Description: Installs required board cores and libraries using arduino-cli.

# Exit immediately if a command exits with a non-zero status.
$ErrorActionPreference = "Stop"

try {
    Write-Host "Updating package index..."
    arduino-cli --config-file ./arduino-cli.yaml core update-index

    Write-Host "Installing Seeed RP2040 boards core..."
    # Install the specific core for Seeed boards, which includes XIAO RP2040
    arduino-cli --config-file ./arduino-cli.yaml core install rp2040:rp2040

    Write-Host "Installing 'Adafruit NeoPixel' library..."
    # This library is used by the NeoPixel_SerialControl example
    arduino-cli --config-file ./arduino-cli.yaml lib install "Adafruit NeoPixel"

    Write-Host "Installation complete."

}
catch {
    Write-Error "An error occurred during installation: $_"
    exit 1
}
