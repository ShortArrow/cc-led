import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { BaseBoard } from './base-board.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load board configuration and create board instance
 */
export class BoardLoader {
  constructor() {
    // Use package installation directory for boards
    this.boardsDir = join(__dirname, '..', '..', 'boards');
    this.availableBoards = this.scanBoards();
  }

  /**
   * Scan for available board configurations
   */
  scanBoards() {
    const boards = {};
    const boardDirs = ['xiao-rp2040', 'raspberry-pi-pico', 'arduino-uno-r4'];
    
    for (const boardId of boardDirs) {
      const configPath = join(this.boardsDir, boardId, 'board.json');
      if (existsSync(configPath)) {
        try {
          const config = JSON.parse(readFileSync(configPath, 'utf-8'));
          boards[boardId] = config;
        } catch (error) {
          console.error(`Failed to load board config for ${boardId}:`, error.message);
        }
      }
    }
    
    return boards;
  }

  /**
   * Get list of available boards
   */
  getAvailableBoards() {
    return Object.entries(this.availableBoards)
      .filter(([_, config]) => config.status !== 'planned')
      .map(([id, config]) => ({
        id,
        name: config.name,
        status: config.status || 'supported'
      }));
  }

  /**
   * Load a specific board
   */
  loadBoard(boardId) {
    const config = this.availableBoards[boardId];
    if (!config) {
      throw new Error(`Board '${boardId}' not found. Available boards: ${Object.keys(this.availableBoards).join(', ')}`);
    }
    
    if (config.status === 'planned') {
      throw new Error(`Board '${boardId}' support is planned but not yet implemented`);
    }
    
    // Create enhanced config with absolute sketch paths
    const enhancedConfig = { ...config };
    if (enhancedConfig.sketches) {
      const boardDir = join(this.boardsDir, boardId);
      for (const [sketchName, sketchInfo] of Object.entries(enhancedConfig.sketches)) {
        enhancedConfig.sketches[sketchName] = {
          ...sketchInfo,
          path: join(boardDir, sketchInfo.path)
        };
      }
    }
    
    // In the future, we can load board-specific classes here
    // For now, use the base board class
    return new BaseBoard(enhancedConfig);
  }

  /**
   * Get board by FQBN
   */
  getBoardByFQBN(fqbn) {
    for (const [id, config] of Object.entries(this.availableBoards)) {
      if (config.fqbn === fqbn) {
        return this.loadBoard(id);
      }
    }
    return null;
  }

  /**
   * Auto-detect board (placeholder for future implementation)
   */
  async autoDetect() {
    // This could use arduino-cli board list to detect connected boards
    // For now, return default
    return this.loadBoard('xiao-rp2040');
  }
}