// Main entry point for the @cc-led/xiao-rp2040 package

export { LedController, executeCommand } from './controller.js';
export { ArduinoCLI, compile, deploy, install } from './arduino.js';
export { loadConfig, getSerialPort } from './utils/config.js';