/**
 * @fileoverview CLI Service with Dependency Injection
 * 
 * Testable CLI service that separates CLI parsing logic from dependencies.
 * Uses dependency injection to enable isolated testing.
 */

import { Command } from 'commander';
import chalk from 'chalk';

/**
 * CLI Service with injected dependencies for testability
 */
export class CLIService {
  /**
   * Create CLI service with injected dependencies
   * @param {object} dependencies - Injected dependencies
   * @param {object} dependencies.controller - Controller service with executeCommand method
   * @param {object} dependencies.arduino - Arduino service with compile, deploy, install methods
   * @param {object} dependencies.boardLoader - Board loader service
   * @param {object} dependencies.config - Config service with getSerialPort method
   * @param {object} dependencies.fileSystem - File system adapter
   * @param {object} options - CLI options
   */
  constructor(dependencies, options = {}) {
    this.controller = dependencies.controller;
    this.arduino = dependencies.arduino;
    this.boardLoader = dependencies.boardLoader;
    this.config = dependencies.config;
    this.fileSystem = dependencies.fileSystem;
    
    this.packageInfo = options.packageInfo || { name: 'cc-led', version: '1.0.0' };
    this.exitHandler = options.exitHandler || process.exit;
    this.consoleHandler = options.consoleHandler || console;
    
    this.program = new Command();
    this.setupCommands();
  }

  /**
   * Setup CLI commands and options
   */
  setupCommands() {
    this.program
      .name(this.packageInfo.name)
      .description('Universal CLI for controlling Arduino board LEDs and managing sketches')
      .version(this.packageInfo.version)
      .option('-b, --board <board>', 'Target board (xiao-rp2040, raspberry-pi-pico, arduino-uno-r4)', 'xiao-rp2040')
      .option('--log-level <level>', 'Arduino CLI log level (trace, debug, info, warn, error)', 'info');

    this.setupLedCommand();
    this.setupCompileCommand();
    this.setupDeployCommand();
    this.setupUtilityCommands();
  }

  /**
   * Setup LED control command
   */
  setupLedCommand() {
    this.program
      .command('led')
      .description('Control the board LED')
      .option('-p, --port <port>', 'Serial port (e.g., COM3 or /dev/ttyUSB0)')
      .option('--on', 'Turn LED on (white)')
      .option('--off', 'Turn LED off')
      .option('-c, --color <color>', 'Set color (red, green, blue, yellow, purple, cyan, white, or R,G,B)')
      .option('-b, --blink [color]', 'Enable blinking mode (optional color, defaults to white)')
      .option('-s, --second-color <color>', 'Second color for two-color blinking')
      .option('-i, --interval <ms>', 'Blink interval or rainbow speed in milliseconds', '500')
      .option('-r, --rainbow', 'Activate rainbow effect')
      .action(async (options) => {
        await this.handleLedCommand(options);
      });
  }

  /**
   * Setup compile command
   */
  setupCompileCommand() {
    this.program
      .command('compile <sketch>')
      .description('Compile an Arduino sketch')
      .option('-c, --config <file>', 'Arduino CLI config file')
      .option('-f, --fqbn <fqbn>', 'Fully Qualified Board Name')
      .option('--log-level <level>', 'Arduino CLI log level (overrides global setting)')
      .action(async (sketch, options) => {
        await this.handleCompileCommand(sketch, options);
      });
  }

  /**
   * Setup deploy/upload command
   */
  setupDeployCommand() {
    this.program
      .command('deploy <sketch>')
      .alias('upload')
      .description('Upload an Arduino sketch to the board')
      .option('-p, --port <port>', 'Serial port (e.g., COM3 or /dev/ttyUSB0)')
      .option('-c, --config <file>', 'Arduino CLI config file')
      .option('-f, --fqbn <fqbn>', 'Fully Qualified Board Name')
      .option('--log-level <level>', 'Arduino CLI log level (overrides global setting)')
      .action(async (sketch, options) => {
        await this.handleDeployCommand(sketch, options);
      });
  }

  /**
   * Setup utility commands (boards, sketches, install, examples)
   */
  setupUtilityCommands() {
    // Boards command
    this.program
      .command('boards')
      .description('List available boards')
      .action(() => {
        this.handleBoardsCommand();
      });

    // Sketches command
    this.program
      .command('sketches')
      .description('List available sketches for a board')
      .action(() => {
        this.handleSketchesCommand();
      });

    // Install command
    this.program
      .command('install')
      .description('Install required board cores and libraries')
      .option('-c, --config <file>', 'Arduino CLI config file')
      .option('--log-level <level>', 'Arduino CLI log level (overrides global setting)')
      .action(async (options) => {
        await this.handleInstallCommand(options);
      });

    // Examples command
    this.program
      .command('examples')
      .description('Show usage examples')
      .action(() => {
        this.handleExamplesCommand();
      });
  }

  /**
   * Handle LED control command
   */
  async handleLedCommand(options) {
    try {
      // Try to get serial port from CLI option, environment variable, or .env file
      try {
        options.port = this.config.getSerialPort(options.port);
      } catch (error) {
        throw new Error('Serial port not specified. Please provide --port argument, set SERIAL_PORT environment variable, or add SERIAL_PORT to .env file');
      }
      
      // Convert interval to number
      options.interval = parseInt(options.interval);
      
      await this.controller.executeCommand(options);
      this.consoleHandler.log(chalk.green('✓ Command executed successfully'));
    } catch (error) {
      this.consoleHandler.error(chalk.red(`✗ ${error.message}`));
      this.exitHandler(1);
    }
  }

  /**
   * Handle compile command
   */
  async handleCompileCommand(sketch, options) {
    try {
      const boardId = this.program.opts().board;
      const board = this.boardLoader.loadBoard(boardId);
      
      // Check if sketch is supported
      if (!board.supportsSketch(sketch)) {
        throw new Error(`Sketch '${sketch}' is not supported on ${board.name}`);
      }
      
      options.board = board;
      options.fqbn = board.fqbn;
      options.logLevel = options.logLevel || this.program.opts().logLevel;
      
      await this.arduino.compile(sketch, options.board, options.logLevel);
      this.consoleHandler.log(chalk.green('✓ Compilation successful'));
    } catch (error) {
      this.consoleHandler.error(chalk.red(`✗ ${error.message}`));
      this.exitHandler(1);
    }
  }

  /**
   * Handle deploy command
   */
  async handleDeployCommand(sketch, options) {
    try {
      const boardId = this.program.opts().board;
      const board = this.boardLoader.loadBoard(boardId);
      
      // Check if sketch is supported
      if (!board.supportsSketch(sketch)) {
        throw new Error(`Sketch '${sketch}' is not supported on ${board.name}`);
      }
      
      options.board = board;
      options.fqbn = board.fqbn;
      options.logLevel = options.logLevel || this.program.opts().logLevel;
      
      await this.arduino.deploy(sketch, options.board, options);
      this.consoleHandler.log(chalk.green('✓ Upload successful'));
    } catch (error) {
      this.consoleHandler.error(chalk.red(`✗ ${error.message}`));
      this.exitHandler(1);
    }
  }

  /**
   * Handle boards command
   */
  handleBoardsCommand() {
    const boards = this.boardLoader.getAvailableBoards();
    this.consoleHandler.log(chalk.cyan('\\n📋 Available Boards:\\n'));
    
    for (const board of boards) {
      const status = board.status === 'supported' ? chalk.green('✓') : chalk.yellow('⚠');
      this.consoleHandler.log(`  ${status} ${chalk.bold(board.id)} - ${board.name}`);
    }
    
    this.consoleHandler.log('\\n' + chalk.gray('Use --board <id> to select a board'));
  }

  /**
   * Handle sketches command
   */
  handleSketchesCommand() {
    try {
      const boardId = this.program.opts().board;
      const board = this.boardLoader.loadBoard(boardId);
      const sketches = board.getAvailableSketches();
      
      this.consoleHandler.log(chalk.cyan(`\\n📝 Available Sketches for ${board.name}:\\n`));
      
      if (sketches.length === 0) {
        this.consoleHandler.log(chalk.gray('  No sketches available for this board.'));
      } else {
        for (const sketch of sketches) {
          this.consoleHandler.log(`  ${chalk.green('●')} ${chalk.bold(sketch.name)}`);
          this.consoleHandler.log(`    ${chalk.gray(sketch.description)}`);
          this.consoleHandler.log(`    ${chalk.dim('Path:')} ${sketch.path}\\n`);
        }
      }
    } catch (error) {
      this.consoleHandler.error(chalk.red(`✗ ${error.message}`));
      this.exitHandler(1);
    }
  }

  /**
   * Handle install command
   */
  async handleInstallCommand(options) {
    try {
      const boardId = this.program.opts().board;
      const board = this.boardLoader.loadBoard(boardId);
      
      options.board = board;
      options.logLevel = options.logLevel || this.program.opts().logLevel;
      
      await this.arduino.install(options);
      this.consoleHandler.log(chalk.green(`✓ Installation complete for ${board.name}`));
    } catch (error) {
      this.consoleHandler.error(chalk.red(`✗ ${error.message}`));
      this.exitHandler(1);
    }
  }

  /**
   * Handle examples command
   */
  handleExamplesCommand() {
    this.consoleHandler.log(chalk.cyan('\\n📚 Usage Examples:\\n'));
    
    this.consoleHandler.log(chalk.yellow('LED Control:'));
    this.consoleHandler.log('  cc-led led --on                         # Turn LED on (white)');
    this.consoleHandler.log('  cc-led led --off                        # Turn LED off');
    this.consoleHandler.log('  cc-led led --color red                  # Set LED to red');
    this.consoleHandler.log('  cc-led led --color 255,100,0            # Set custom RGB color');
    this.consoleHandler.log('  cc-led led --blink                      # Blink white (default)');
    this.consoleHandler.log('  cc-led led --blink green                # Blink green');
    this.consoleHandler.log('  cc-led led --blink --color green        # Blink green (alternative)');
    this.consoleHandler.log('  cc-led led --rainbow                    # Rainbow effect');
    this.consoleHandler.log('  cc-led --board xiao-rp2040 led --color red  # Specify board');
    this.consoleHandler.log('');
    
    this.consoleHandler.log(chalk.yellow('Arduino Management:'));
    this.consoleHandler.log('  cc-led compile NeoPixel_SerialControl   # Compile sketch');
    this.consoleHandler.log('  cc-led deploy NeoPixel_SerialControl -p COM3');
    this.consoleHandler.log('  cc-led install                          # Install dependencies');
    this.consoleHandler.log('  cc-led --board raspberry-pi-pico compile LEDBlink');
    this.consoleHandler.log('');
    
    this.consoleHandler.log(chalk.yellow('Arduino CLI Logging:'));
    this.consoleHandler.log('  cc-led --log-level debug compile LEDBlink    # Debug verbose output');
    this.consoleHandler.log('  cc-led --log-level warn install             # Show only warnings and errors');
    this.consoleHandler.log('  cc-led compile LEDBlink --log-level trace   # Most verbose output');
    this.consoleHandler.log('');
    
    this.consoleHandler.log(chalk.yellow('Digital LED Boards (Arduino Uno R4, etc.):'));
    this.consoleHandler.log('  cc-led --board arduino-uno-r4 led --on      # Turn on builtin LED');
    this.consoleHandler.log('  cc-led --board arduino-uno-r4 led --off     # Turn off builtin LED');  
    this.consoleHandler.log('  cc-led --board arduino-uno-r4 led --blink   # Blink builtin LED (500ms)');
    this.consoleHandler.log('  cc-led --board arduino-uno-r4 led --blink --interval 250  # Fast blink (250ms)');
    this.consoleHandler.log('  cc-led --board arduino-uno-r4 led --color red  # Same as --on (color ignored)');
    this.consoleHandler.log('');
    
    this.consoleHandler.log(chalk.gray('Port can be set via -p option or SERIAL_PORT in .env file'));
    this.consoleHandler.log(chalk.gray('Log levels: trace, debug, info (default), warn, error'));
    this.consoleHandler.log(chalk.gray('Note: Digital LED boards ignore color options and use simple on/off/blink'));
  }

  /**
   * Parse CLI arguments and execute commands
   * @param {string[]} argv - Command line arguments
   * @returns {Promise<void>}
   */
  async parse(argv) {
    // Show help if no command provided
    if (argv.length === 2) {
      this.program.help();
      return;
    }

    await this.program.parseAsync(argv);
  }

  /**
   * Get parsed options for testing
   * @param {string[]} argv - Command line arguments
   * @returns {object} Parsed options
   */
  parseOptions(argv) {
    // Create a separate program instance for parsing without execution
    const testProgram = new Command();
    this.setupCommandsForParsing(testProgram);
    
    // Parse arguments and return the parsed options
    testProgram.parse(argv, { from: 'user' });
    return testProgram.opts();
  }

  /**
   * Setup commands for parsing only (without action handlers)
   * Used for testing option parsing without side effects
   */
  setupCommandsForParsing(program) {
    program
      .name(this.packageInfo.name)
      .version(this.packageInfo.version)
      .option('-b, --board <board>', 'Target board', 'xiao-rp2040')
      .option('--log-level <level>', 'Log level', 'info');

    program
      .command('led')
      .option('-p, --port <port>', 'Serial port')
      .option('--on', 'Turn LED on')
      .option('--off', 'Turn LED off')
      .option('-c, --color <color>', 'Set color')
      .option('-b, --blink [color]', 'Blink mode')
      .option('-s, --second-color <color>', 'Second color')
      .option('-i, --interval <ms>', 'Interval', '500')
      .option('-r, --rainbow', 'Rainbow effect');

    program
      .command('compile <sketch>')
      .option('--log-level <level>', 'Log level');

    program
      .command('deploy <sketch>')
      .alias('upload')
      .option('-p, --port <port>', 'Serial port')
      .option('--log-level <level>', 'Log level');
  }
}