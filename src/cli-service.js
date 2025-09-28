/**
 * @fileoverview CLI Service with Dependency Injection
 * 
 * Testable CLI service that separates CLI parsing logic from dependencies.
 * Uses dependency injection to enable isolated testing.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createMcpCommands } from './presentation/mcp/mcp-cli-commands.js';
import { execSync } from 'child_process';

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
    // Custom version handling with git/package options
    this.program
      .name(this.packageInfo.name)
      .description('Universal CLI for controlling Arduino board LEDs and managing sketches')
      .option('-V, --version [type]', 'Display version information (package, git)', 'package')
      .option('-b, --board <board>', 'Target board (xiao-rp2040, raspberry-pi-pico, arduino-uno-r4)', 'xiao-rp2040')
      .option('--log-level <level>', 'Arduino CLI log level (trace, debug, info, warn, error)', 'info');

    this.setupLedCommand();
    this.setupCompileCommand();
    this.setupDeployCommand();
    this.setupUtilityCommands();
    this.setupInfoCommand();
    this.setupMcpCommands();
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
      .option('--firmware-version', 'Get microcontroller firmware version information')
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
      
      // Create install options with board included
      const installOptions = {
        ...options,
        board: board,
        logLevel: options.logLevel || this.program.opts().logLevel
      };
      
      // Call install with options object containing board
      await this.arduino.install(installOptions);
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
    this.consoleHandler.log('  cc-led led --firmware-version -p COM3  # Get microcontroller firmware version');
    this.consoleHandler.log('  cc-led --board xiao-rp2040 led --color red  # Specify board');
    this.consoleHandler.log('');
    
    this.consoleHandler.log(chalk.yellow('Project Information:'));
    this.consoleHandler.log('  cc-led info                             # Comprehensive project information');
    this.consoleHandler.log('  cc-led info --version-git               # Git version only');
    this.consoleHandler.log('  cc-led info --version-package           # Package version only');
    this.consoleHandler.log('  cc-led info --build-flags --board xiao-rp2040  # Arduino build flags');
    this.consoleHandler.log('  cc-led info --json                      # JSON format output');
    this.consoleHandler.log('');
    
    this.consoleHandler.log(chalk.yellow('Version Information (Legacy):'));
    this.consoleHandler.log('  cc-led --version                        # Show package.json version (default)');
    this.consoleHandler.log('  cc-led --version package                # Show package.json version explicitly');
    this.consoleHandler.log('  cc-led --version git                    # Show Git version (tag or commit hash)');
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
   * Setup info command
   */
  setupInfoCommand() {
    this.program
      .command('info')
      .description('Display comprehensive project and version information')
      .option('--version-git', 'Display Git version information only')
      .option('--version-package', 'Display package.json version only')
      .option('--build-flags', 'Display Arduino build flags format')
      .option('--json', 'Display information in JSON format')
      .option('--board <board-id>', 'Include board-specific information')
      .action(async (options) => {
        await this.handleInfoCommand(options);
      });
  }

  /**
   * Get version information from Git
   * @returns {object} Version information object
   */
  getVersionInfo() {
    try {
      // Check if we're in a git repository
      const isGitRepo = this.executeGitCommand('git rev-parse --git-dir', '') !== '';
      
      if (!isGitRepo) {
        return {
          version: '0.0.0-dev',
          commit: 'unknown',
          tag: null,
          branch: 'unknown',
          buildDate: new Date().toISOString().split('T')[0],
          isClean: false
        };
      }

      // Get the most recent tag
      const latestTag = this.executeGitCommand('git describe --tags --abbrev=0 2>/dev/null', '');
      
      // Get current commit hash (short)
      const commitHash = this.executeGitCommand('git rev-parse --short HEAD', 'unknown');
      
      // Get current branch
      const branch = this.executeGitCommand('git branch --show-current', 'unknown');
      
      // Check if working directory is clean
      const statusOutput = this.executeGitCommand('git status --porcelain', '');
      const isClean = statusOutput === '';
      
      // Determine version
      let version;
      if (latestTag) {
        // Check if current commit is exactly on the tag
        const tagCommit = this.executeGitCommand(`git rev-parse ${latestTag}^{commit}`, '');
        const currentCommit = this.executeGitCommand('git rev-parse HEAD', '');
        
        if (tagCommit === currentCommit && isClean) {
          // Exact tag match and clean working directory
          version = latestTag;
        } else {
          // Tag exists but we're ahead or have modifications
          const commitsAhead = this.executeGitCommand(`git rev-list ${latestTag}..HEAD --count`, '0');
          if (commitsAhead === '0' && !isClean) {
            version = `${latestTag}-dirty`;
          } else {
            version = `${latestTag}-${commitsAhead}-g${commitHash}${!isClean ? '-dirty' : ''}`;
          }
        }
      } else {
        // No tags, use commit hash
        version = `${commitHash}${!isClean ? '-dirty' : ''}`;
      }

      return {
        version,
        commit: commitHash,
        tag: latestTag || null,
        branch,
        buildDate: new Date().toISOString().split('T')[0],
        isClean
      };
    } catch (error) {
      // Fallback if git commands fail
      return {
        version: '0.0.0-dev',
        commit: 'unknown',
        tag: null,
        branch: 'unknown',
        buildDate: new Date().toISOString().split('T')[0],
        isClean: false
      };
    }
  }

  /**
   * Execute git command safely
   * @param {string} command - Git command to execute
   * @param {string} fallback - Fallback value if command fails
   * @returns {string} Command output or fallback value
   */
  executeGitCommand(command, fallback = 'unknown') {
    try {
      const result = execSync(command, { 
        cwd: process.cwd(), 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'] // Suppress stderr
      }).trim();
      return result;
    } catch (error) {
      return fallback;
    }
  }

  /**
   * Handle info command
   * @param {object} options - Command options
   */
  async handleInfoCommand(options) {
    try {
      const versionInfo = this.getVersionInfo();
      const packageVersion = this.packageInfo.version;
      const boardId = options.board || this.program.opts().board;

      // Handle specific output formats
      if (options.versionGit) {
        this.consoleHandler.log(versionInfo.version);
        return;
      }

      if (options.versionPackage) {
        this.consoleHandler.log(packageVersion);
        return;
      }

      if (options.buildFlags) {
        const buildFlags = this.generateBuildFlags(versionInfo, boardId);
        this.consoleHandler.log(buildFlags);
        return;
      }

      if (options.json) {
        const jsonOutput = {
          project: this.packageInfo.name,
          packageVersion,
          gitVersion: versionInfo.version,
          gitCommit: versionInfo.commit,
          gitTag: versionInfo.tag,
          gitBranch: versionInfo.branch,
          buildDate: versionInfo.buildDate,
          isClean: versionInfo.isClean,
          board: boardId
        };
        this.consoleHandler.log(JSON.stringify(jsonOutput, null, 2));
        return;
      }

      // Default: comprehensive human-readable output
      this.displayComprehensiveInfo(versionInfo, packageVersion, boardId);
    } catch (error) {
      this.consoleHandler.error(chalk.red(`✗ Error getting project information: ${error.message}`));
      this.exitHandler(1);
    }
  }

  /**
   * Display comprehensive project information in human-readable format
   * @param {object} versionInfo - Git version information
   * @param {string} packageVersion - Package.json version
   * @param {string} boardId - Board identifier
   */
  displayComprehensiveInfo(versionInfo, packageVersion, boardId) {
    this.consoleHandler.log(chalk.cyan(`\n📋 Project Information\n`));
    
    this.consoleHandler.log(`${chalk.bold('Project:')} ${this.packageInfo.name}`);
    this.consoleHandler.log(`${chalk.bold('Package Version:')} ${packageVersion}`);
    this.consoleHandler.log(`${chalk.bold('Git Version:')} ${versionInfo.version}`);
    this.consoleHandler.log(`${chalk.bold('Git Commit:')} ${versionInfo.commit}`);
    
    if (versionInfo.tag) {
      this.consoleHandler.log(`${chalk.bold('Git Tag:')} ${versionInfo.tag}`);
    }
    
    this.consoleHandler.log(`${chalk.bold('Git Branch:')} ${versionInfo.branch}`);
    this.consoleHandler.log(`${chalk.bold('Build Date:')} ${versionInfo.buildDate}`);
    this.consoleHandler.log(`${chalk.bold('Working Directory:')} ${versionInfo.isClean ? chalk.green('Clean') : chalk.yellow('Dirty')}`);
    this.consoleHandler.log(`${chalk.bold('Target Board:')} ${boardId}`);
    
    this.consoleHandler.log(chalk.gray(`\nUse '${this.packageInfo.name} info --help' for more options`));
  }

  /**
   * Generate Arduino build flags from version information
   * @param {object} versionInfo - Version information object
   * @param {string} boardId - Board identifier
   * @returns {string} Build flags string
   */
  generateBuildFlags(versionInfo, boardId = 'unknown') {
    const flags = [
      `-DFIRMWARE_VERSION=\\"${versionInfo.version}\\"`,
      `-DFIRMWARE_COMMIT=\\"${versionInfo.commit}\\"`,
      `-DFIRMWARE_BUILD_DATE=\\"${versionInfo.buildDate}\\"`,
      `-DFIRMWARE_BOARD=\\"${boardId}\\"`,
      `-DFIRMWARE_NAME=\\"UniversalLedControl\\"`,
      `-DFIRMWARE_BRANCH=\\"${versionInfo.branch}\\"`,
      `-DFIRMWARE_IS_CLEAN=${versionInfo.isClean ? '1' : '0'}`
    ];
    
    if (versionInfo.tag) {
      flags.push(`-DFIRMWARE_TAG=\\"${versionInfo.tag}\\"`);
    }
    
    return flags.join(' ');
  }

  /**
   * Handle --version command with git/package options
   * @param {string} versionType - Type of version to display ('package' or 'git')
   */
  async handleVersionCommand(versionType) {
    try {
      if (versionType === 'git') {
        // Get Git version information
        const versionInfo = this.getVersionInfo();
        this.consoleHandler.log(versionInfo.version);
      } else if (versionType === 'package') {
        // Use package.json version
        this.consoleHandler.log(this.packageInfo.version);
      } else {
        // Invalid version type
        this.consoleHandler.error(chalk.red(`✗ Invalid version type: ${versionType}. Use 'git' or 'package'.`));
        this.exitHandler(1);
      }
    } catch (error) {
      this.consoleHandler.error(chalk.red(`✗ Error getting version information: ${error.message}`));
      this.exitHandler(1);
    }
  }

  /**
   * Parse CLI arguments and execute commands
   * @param {string[]} argv - Command line arguments
   * @returns {Promise<void>}
   */
  async parse(argv) {
    // Handle --version option before parsing
    const versionIndex = argv.findIndex(arg => arg === '--version' || arg === '-V');
    if (versionIndex !== -1) {
      const versionType = argv[versionIndex + 1] && !argv[versionIndex + 1].startsWith('-') ? argv[versionIndex + 1] : 'package';
      await this.handleVersionCommand(versionType);
      return;
    }

    // Show help if no command provided
    if (argv.length === 2) {
      this.program.help();
      return;
    }

    await this.program.parseAsync(argv);
  }

  /**
   * Setup MCP commands
   */
  setupMcpCommands() {
    const mcpCommand = createMcpCommands();
    this.program.addCommand(mcpCommand);
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
      .option('-V, --version [type]', 'Display version information (package, git)', 'package')
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
      .option('-r, --rainbow', 'Rainbow effect')
      .option('--firmware-version', 'Get microcontroller firmware version information');

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