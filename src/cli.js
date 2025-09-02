#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { executeCommand } from './controller.js';
import { compile, deploy, install } from './arduino.js';
import { BoardLoader } from './boards/board-loader.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')
);

const program = new Command();

const boardLoader = new BoardLoader();

program
  .name('cc-led')
  .description('Universal CLI for controlling Arduino board LEDs and managing sketches')
  .version(packageJson.version)
  .option('-b, --board <board>', 'Target board (xiao-rp2040, raspberry-pi-pico, arduino-uno-r4)', 'xiao-rp2040')
  .option('--log-level <level>', 'Arduino CLI log level (trace, debug, info, warn, error)', 'info');

// LED control command
program
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
    try {
      // LED command only needs port - no board-specific processing required
      if (!options.port) {
        throw new Error('Serial port is required. Use -p or --port option');
      }
      
      // Convert interval to number
      options.interval = parseInt(options.interval);
      
      await executeCommand(options);
      console.log(chalk.green('✓ Command executed successfully'));
    } catch (error) {
      console.error(chalk.red(`✗ ${error.message}`));
      process.exit(1);
    }
  });

// Compile command
program
  .command('compile <sketch>')
  .description('Compile an Arduino sketch')
  .option('-c, --config <file>', 'Arduino CLI config file')
  .option('-f, --fqbn <fqbn>', 'Fully Qualified Board Name')
  .option('--log-level <level>', 'Arduino CLI log level (overrides global setting)')
  .action(async (sketch, options) => {
    try {
      const boardId = program.opts().board;
      const board = boardLoader.loadBoard(boardId);
      
      // Check if sketch is supported
      if (!board.supportsSketch(sketch)) {
        throw new Error(`Sketch '${sketch}' is not supported on ${board.name}`);
      }
      
      options.board = board;
      options.fqbn = board.fqbn;
      options.logLevel = options.logLevel || program.opts().logLevel;
      
      await compile(sketch, options);
      console.log(chalk.green('✓ Compilation successful'));
    } catch (error) {
      console.error(chalk.red(`✗ ${error.message}`));
      process.exit(1);
    }
  });

// Deploy/Upload command
program
  .command('deploy <sketch>')
  .alias('upload')
  .description('Upload an Arduino sketch to the board')
  .option('-p, --port <port>', 'Serial port (e.g., COM3 or /dev/ttyUSB0)')
  .option('-c, --config <file>', 'Arduino CLI config file')
  .option('-f, --fqbn <fqbn>', 'Fully Qualified Board Name')
  .option('--log-level <level>', 'Arduino CLI log level (overrides global setting)')
  .action(async (sketch, options) => {
    try {
      const boardId = program.opts().board;
      const board = boardLoader.loadBoard(boardId);
      
      // Check if sketch is supported
      if (!board.supportsSketch(sketch)) {
        throw new Error(`Sketch '${sketch}' is not supported on ${board.name}`);
      }
      
      options.board = board;
      options.fqbn = board.fqbn;
      options.logLevel = options.logLevel || program.opts().logLevel;
      
      await deploy(sketch, options);
      console.log(chalk.green('✓ Upload successful'));
    } catch (error) {
      console.error(chalk.red(`✗ ${error.message}`));
      process.exit(1);
    }
  });

// List boards command
program
  .command('boards')
  .description('List available boards')
  .action(() => {
    const boards = boardLoader.getAvailableBoards();
    console.log(chalk.cyan('\n📋 Available Boards:\n'));
    
    for (const board of boards) {
      const status = board.status === 'supported' ? chalk.green('✓') : chalk.yellow('⚠');
      console.log(`  ${status} ${chalk.bold(board.id)} - ${board.name}`);
    }
    
    console.log('\n' + chalk.gray('Use --board <id> to select a board'));
  });

// List sketches command
program
  .command('sketches')
  .description('List available sketches for a board')
  .action(() => {
    try {
      const boardId = program.opts().board;
      const board = boardLoader.loadBoard(boardId);
      const sketches = board.getAvailableSketches();
      
      console.log(chalk.cyan(`\n📝 Available Sketches for ${board.name}:\n`));
      
      if (sketches.length === 0) {
        console.log(chalk.gray('  No sketches available for this board.'));
      } else {
        for (const sketch of sketches) {
          console.log(`  ${chalk.green('●')} ${chalk.bold(sketch.name)}`);
          console.log(`    ${chalk.gray(sketch.description)}`);
          console.log(`    ${chalk.dim('Path:')} ${sketch.path}\n`);
        }
      }
    } catch (error) {
      console.error(chalk.red(`✗ ${error.message}`));
      process.exit(1);
    }
  });

// Install command
program
  .command('install')
  .description('Install required board cores and libraries')
  .option('-c, --config <file>', 'Arduino CLI config file')
  .option('--log-level <level>', 'Arduino CLI log level (overrides global setting)')
  .action(async (options) => {
    try {
      const boardId = program.opts().board;
      const board = boardLoader.loadBoard(boardId);
      
      options.board = board;
      options.logLevel = options.logLevel || program.opts().logLevel;
      
      await install(options);
      console.log(chalk.green(`✓ Installation complete for ${board.name}`));
    } catch (error) {
      console.error(chalk.red(`✗ ${error.message}`));
      process.exit(1);
    }
  });

// Examples command
program
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    console.log(chalk.cyan('\n📚 Usage Examples:\n'));
    
    console.log(chalk.yellow('LED Control:'));
    console.log('  cc-led led --on                         # Turn LED on (white)');
    console.log('  cc-led led --off                        # Turn LED off');
    console.log('  cc-led led --color red                  # Set LED to red');
    console.log('  cc-led led --color 255,100,0            # Set custom RGB color');
    console.log('  cc-led led --blink                      # Blink white (default)');
    console.log('  cc-led led --blink green                # Blink green');
    console.log('  cc-led led --blink --color green        # Blink green (alternative)');
    console.log('  cc-led led --rainbow                    # Rainbow effect');
    console.log('  cc-led --board xiao-rp2040 led --color red  # Specify board');
    console.log('');
    
    console.log(chalk.yellow('Arduino Management:'));
    console.log('  cc-led compile NeoPixel_SerialControl   # Compile sketch');
    console.log('  cc-led deploy NeoPixel_SerialControl -p COM3');
    console.log('  cc-led install                          # Install dependencies');
    console.log('  cc-led --board raspberry-pi-pico compile LEDBlink');
    console.log('');
    
    console.log(chalk.yellow('Arduino CLI Logging:'));
    console.log('  cc-led --log-level debug compile LEDBlink    # Debug verbose output');
    console.log('  cc-led --log-level warn install             # Show only warnings and errors');
    console.log('  cc-led compile LEDBlink --log-level trace   # Most verbose output');
    console.log('');
    
    console.log(chalk.yellow('Digital LED Boards (Arduino Uno R4, etc.):'));
    console.log('  cc-led --board arduino-uno-r4 led --on      # Turn on builtin LED');
    console.log('  cc-led --board arduino-uno-r4 led --off     # Turn off builtin LED');  
    console.log('  cc-led --board arduino-uno-r4 led --blink   # Blink builtin LED (500ms)');
    console.log('  cc-led --board arduino-uno-r4 led --blink --interval 250  # Fast blink (250ms)');
    console.log('  cc-led --board arduino-uno-r4 led --color red  # Same as --on (color ignored)');
    console.log('');
    
    console.log(chalk.gray('Port can be set via -p option or SERIAL_PORT in .env file'));
    console.log(chalk.gray('Log levels: trace, debug, info (default), warn, error'));
    console.log(chalk.gray('Note: Digital LED boards ignore color options and use simple on/off/blink'));
  });

program.parse(process.argv);

// Show help if no command provided
if (process.argv.length === 2) {
  program.help();
}
