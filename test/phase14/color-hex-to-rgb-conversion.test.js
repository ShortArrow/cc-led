import { describe, it, expect } from 'vitest';

/**
 * Phase 14: MCP Command Conversion Tests - Color Hex to RGB Conversion
 * Test ID: C1-001 to C1-008
 * 
 * Validates #RRGGBB to R,G,B conversion according to MCP specification
 */

// Color conversion logic extracted from actual MCP server
function convertHexToRgb(hexColor) {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);  
  const b = parseInt(hex.substr(4, 2), 16);
  return `${r},${g},${b}`;
}

describe('C1-001 to C1-008: Color Hex to RGB Conversion Specification', () => {
  
  it('C1-001: should convert red #FF0000 to 255,0,0', () => {
    const result = convertHexToRgb('#FF0000');
    expect(result).toBe('255,0,0');
  });

  it('C1-002: should convert green #00FF00 to 0,255,0', () => {
    const result = convertHexToRgb('#00FF00');
    expect(result).toBe('0,255,0');
  });

  it('C1-003: should convert blue #0000FF to 0,0,255', () => {
    const result = convertHexToRgb('#0000FF');
    expect(result).toBe('0,0,255');
  });

  it('C1-004: should convert white #FFFFFF to 255,255,255', () => {
    const result = convertHexToRgb('#FFFFFF');
    expect(result).toBe('255,255,255');
  });

  it('C1-005: should convert black #000000 to 0,0,0', () => {
    const result = convertHexToRgb('#000000');
    expect(result).toBe('0,0,0');
  });

  it('C1-006: should convert custom color #80C0FF to 128,192,255', () => {
    const result = convertHexToRgb('#80C0FF');
    expect(result).toBe('128,192,255');
  });

  it('C1-007: should convert custom color #FF8000 to 255,128,0', () => {
    const result = convertHexToRgb('#FF8000');
    expect(result).toBe('255,128,0');
  });

  it('C1-008: should convert custom color #FF00FF to 255,0,255', () => {
    const result = convertHexToRgb('#FF00FF');
    expect(result).toBe('255,0,255');
  });
});