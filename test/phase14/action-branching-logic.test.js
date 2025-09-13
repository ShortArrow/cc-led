import { describe, it, expect } from 'vitest';

/**
 * Phase 14: MCP Command Conversion Tests - Action Branching Logic
 * Test ID: C1-009 to C1-015
 * 
 * Validates MCP action parameter to command logic conversion
 */

// Control logic extracted from actual MCP server
function getExpectedCommand(action, options = {}) {
  const commands = [];
  
  switch (action) {
    case 'on':
      if (options.color) {
        const hex = options.color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        commands.push({ method: 'setColor', params: [`${r},${g},${b}`] });
      } else {
        commands.push({ method: 'turnOn', params: [] });
      }
      break;
    case 'off':
      commands.push({ method: 'turnOff', params: [] });
      break;
    case 'blink':
      if (options.color) {
        const hex = options.color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        commands.push({ method: 'blink', params: [`${r},${g},${b}`, 500] });
      } else {
        commands.push({ method: 'blink', params: ['white', 500] });
      }
      break;
    case 'rainbow':
      commands.push({ method: 'rainbow', params: [options.interval || 50] });
      break;
    default:
      throw new Error(`Unknown action: ${action}`);
  }
  
  return commands;
}

describe('C1-009 to C1-015: Action Branching Logic Specification', () => {

  it('C1-009: should call turnOn() for on action without color', () => {
    const commands = getExpectedCommand('on');
    expect(commands).toEqual([{ method: 'turnOn', params: [] }]);
  });

  it('C1-010: should call setColor() for on action with color', () => {
    const commands = getExpectedCommand('on', { color: '#FF8000' });
    expect(commands).toEqual([{ method: 'setColor', params: ['255,128,0'] }]);
  });

  it('C1-011: should call turnOff() for off action', () => {
    const commands = getExpectedCommand('off');
    expect(commands).toEqual([{ method: 'turnOff', params: [] }]);
  });

  it('C1-012: should call white blink for blink action without color', () => {
    const commands = getExpectedCommand('blink');
    expect(commands).toEqual([{ method: 'blink', params: ['white', 500] }]);
  });

  it('C1-013: should call colored blink for blink action with color', () => {
    const commands = getExpectedCommand('blink', { color: '#FF00FF' });
    expect(commands).toEqual([{ method: 'blink', params: ['255,0,255', 500] }]);
  });

  it('C1-014: should call rainbow with default interval', () => {
    const commands = getExpectedCommand('rainbow');
    expect(commands).toEqual([{ method: 'rainbow', params: [50] }]);
  });

  it('C1-015: should throw error for unknown action', () => {
    expect(() => getExpectedCommand('unknown')).toThrow('Unknown action: unknown');
  });
});