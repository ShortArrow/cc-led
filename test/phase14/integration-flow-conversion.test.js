import { describe, it, expect } from 'vitest';

/**
 * Phase 14: MCP Command Conversion Tests - Integration Flow Conversion
 * Test ID: C1-022 to C1-024
 * 
 * Validates complete MCP → RGB → Board command conversion flow
 */

// Complete conversion flow: MCP → RGB → Board command
function fullConversionFlow(action, mcpOptions = {}) {
  // Step 1: Convert MCP color specification to RGB
  let rgbColor = null;
  if (mcpOptions.color) {
    const hex = mcpOptions.color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    rgbColor = `${r},${g},${b}`;
  }

  // Step 2: Generate board command
  switch (action) {
    case 'on':
      return rgbColor ? `COLOR,${rgbColor}` : 'ON';
    case 'off':
      return 'OFF';
    case 'blink':
      const interval = mcpOptions.interval || 500;
      return rgbColor ? `BLINK1,${rgbColor},${interval}` : `BLINK1,255,255,255,${interval}`;
    case 'rainbow':
      const rainbowInterval = mcpOptions.interval || 50;
      return `RAINBOW,${rainbowInterval}`;
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

// Two-color conversion flow: MCP → RGB → Board command with BLINK2
function fullConversionFlowWithSecondColor(action, mcpOptions = {}) {
  // Step 1: Convert both colors to RGB
  let rgbColor1 = null;
  let rgbColor2 = null;
  
  if (mcpOptions.color) {
    const hex1 = mcpOptions.color.replace('#', '');
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    rgbColor1 = `${r1},${g1},${b1}`;
  }
  
  if (mcpOptions.secondColor) {
    const hex2 = mcpOptions.secondColor.replace('#', '');
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    rgbColor2 = `${r2},${g2},${b2}`;
  }

  // Step 2: Generate board command
  switch (action) {
    case 'blink':
      const interval = mcpOptions.interval || 500;
      if (rgbColor1 && rgbColor2) {
        return `BLINK2,${rgbColor1},${rgbColor2},${interval}`;
      } else {
        // Fallback to single color blink
        return rgbColor1 ? `BLINK1,${rgbColor1},${interval}` : `BLINK1,255,255,255,${interval}`;
      }
    default:
      throw new Error(`Two-color conversion only supported for blink action: ${action}`);
  }
}

describe('C1-022 to C1-024: Integration Flow Conversion Specification', () => {

  it('C1-022: should convert MCP controlLed(1, "on", {color: "#FF0000"}) → Board COLOR,255,0,0', () => {
    const boardCommand = fullConversionFlow('on', { color: '#FF0000' });
    expect(boardCommand).toBe('COLOR,255,0,0');
  });

  it('C1-023: should convert MCP controlLed(1, "on") → Board ON', () => {
    const boardCommand = fullConversionFlow('on');
    expect(boardCommand).toBe('ON');
  });

  it('C1-024: should convert MCP controlLed(1, "off") → Board OFF', () => {
    const boardCommand = fullConversionFlow('off');
    expect(boardCommand).toBe('OFF');
  });

  it('C1-025: should convert MCP controlLed(1, "blink", {color: "#0000FF"}) → Board BLINK1,0,0,255,500', () => {
    const boardCommand = fullConversionFlow('blink', { color: '#0000FF' });
    expect(boardCommand).toBe('BLINK1,0,0,255,500');
  });

  it('C1-026: should convert MCP controlLed(1, "blink") → Board BLINK1,255,255,255,500', () => {
    const boardCommand = fullConversionFlow('blink');
    expect(boardCommand).toBe('BLINK1,255,255,255,500');
  });

  it('C1-027: should convert MCP controlLed(1, "blink", {interval: 1000}) → Board BLINK1,255,255,255,1000', () => {
    const boardCommand = fullConversionFlow('blink', { interval: 1000 });
    expect(boardCommand).toBe('BLINK1,255,255,255,1000');
  });

  it('C1-028: should convert MCP controlLed(1, "rainbow", {interval: 30}) → Board RAINBOW,30', () => {
    const boardCommand = fullConversionFlow('rainbow', { interval: 30 });
    expect(boardCommand).toBe('RAINBOW,30');
  });

  it('C1-029: should convert MCP controlLed(1, "blink", {color: "#FF0000", secondColor: "#0000FF"}) → Board BLINK2,255,0,0,0,0,255,500', () => {
    const boardCommand = fullConversionFlowWithSecondColor('blink', { 
      color: '#FF0000', 
      secondColor: '#0000FF' 
    });
    expect(boardCommand).toBe('BLINK2,255,0,0,0,0,255,500');
  });
});