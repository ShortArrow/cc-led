/**
 * Base class for board implementations
 */
export class BaseBoard {
  constructor(config) {
    this.config = config;
    this.name = config.name;
    this.id = config.id;
    this.fqbn = config.fqbn;
  }

  /**
   * Get board-specific Arduino CLI arguments
   */
  getCompileArgs(sketchPath) {
    return ['compile', '--fqbn', this.fqbn, sketchPath];
  }

  /**
   * Get board-specific upload arguments
   */
  getUploadArgs(sketchPath, port) {
    return ['upload', '--port', port, '--fqbn', this.fqbn, sketchPath];
  }

  /**
   * Get board installation commands
   */
  getInstallCommands() {
    const commands = [];
    
    // Add board platform
    if (this.config.platform) {
      commands.push(['core', 'install', this.config.platform.package]);
    }
    
    // Add libraries
    if (this.config.libraries) {
      for (const lib of this.config.libraries) {
        commands.push(['lib', 'install', `"${lib.name}"`]);
      }
    }
    
    return commands;
  }

  /**
   * Get default serial port for the platform
   */
  getDefaultPort() {
    const platform = process.platform;
    const ports = this.config.serial?.defaultPort || {};
    
    switch (platform) {
      case 'win32':
        return ports.windows || 'COM3';
      case 'darwin':
        return ports.darwin || '/dev/tty.usbmodem*';
      case 'linux':
        return ports.linux || '/dev/ttyACM0';
      default:
        return 'COM3';
    }
  }

  /**
   * Check if sketch is supported
   */
  supportsSketch(sketchName) {
    if (!this.config.sketches) {
      return false;
    }
    return sketchName in this.config.sketches;
  }

  /**
   * Get sketch path relative to board directory
   */
  getSketchPath(sketchName) {
    if (!this.supportsSketch(sketchName)) {
      throw new Error(`Sketch '${sketchName}' is not supported on ${this.name}`);
    }
    return this.config.sketches[sketchName].path;
  }

  /**
   * Get available sketches for this board
   */
  getAvailableSketches() {
    if (!this.config.sketches) {
      return [];
    }
    return Object.entries(this.config.sketches).map(([name, info]) => ({
      name,
      description: info.description,
      path: info.path
    }));
  }

  /**
   * Get LED control protocol
   */
  getLedProtocol() {
    return this.config.led?.protocol || 'Digital';
  }
}