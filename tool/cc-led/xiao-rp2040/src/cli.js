#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { executeCommand } from './controller.js';
import { compile, deploy, install } from './arduino.js';
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

program
  .name('xiao-rp2040')
  .description('CLI tool for XIAO RP2040 LED control and Arduino sketch management')
  .version(packageJson.version);

// LED control command
program
  .command('led')
  .description('Control the XIAO RP2040 LED')
  .option('-p, --port <port>', 'Serial port (e.g., COM3 or /dev/ttyUSB0)')
  .option('--on', 'Turn LED on (white)')
  .option('--off', 'Turn LED off')
  .option('-c, --color <color>', 'Set color (red, green, blue, yellow, purple, cyan, white, or R,G,B)')
  .option('-b, --blink', 'Enable blinking mode')
  .option('-s, --second-color <color>', 'Second color for two-color blinking')
  .option('-i, --interval <ms>', 'Blink interval or rainbow speed in milliseconds', '500')
  .option('-r, --rainbow', 'Activate rainbow effect')
  .action(async (options) => {
    try {
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
  .action(async (sketch, options) => {
    try {
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
  .action(async (sketch, options) => {
    try {
      await deploy(sketch, options);
      console.log(chalk.green('✓ Upload successful'));
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
  .action(async (options) => {
    try {
      await install(options);
      console.log(chalk.green('✓ Installation complete'));
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
    console.log('  xiao-rp2040 led --on                    # Turn LED on (white)');
    console.log('  xiao-rp2040 led --off                   # Turn LED off');
    console.log('  xiao-rp2040 led --color red             # Set LED to red');
    console.log('  xiao-rp2040 led --color 255,100,0       # Set custom RGB color');
    console.log('  xiao-rp2040 led --blink --color green   # Blink green');
    console.log('  xiao-rp2040 led --rainbow               # Rainbow effect');
    console.log('  xiao-rp2040 led --blink --color red --second-color blue --interval 1000');
    console.log('');
    
    console.log(chalk.yellow('Arduino Management:'));
    console.log('  xiao-rp2040 compile LEDBlink            # Compile sketch');
    console.log('  xiao-rp2040 deploy NeoPixel_SerialControl -p COM3');
    console.log('  xiao-rp2040 install                     # Install dependencies');
    console.log('');
    
    console.log(chalk.gray('Port can be set via -p option or SERIAL_PORT in .env file'));
  });

program.parse(process.argv);

// Show help if no command provided
if (process.argv.length === 2) {
  program.help();
}