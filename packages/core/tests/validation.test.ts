import { describe, expect, it } from 'vitest';
import {
  aspectRatioToResolution,
  estimateCredits,
  generateCollectionSeeds,
  isValidApiKey,
} from '../src/utils/validation.js';

describe('validation utilities', () => {
  it('computes resolution from aspect ratio', () => {
    const resolution = aspectRatioToResolution('16:9', 1024);
    expect(resolution.width).toBeGreaterThan(resolution.height);
    expect(resolution.width % 8).toBe(0);
    expect(resolution.height % 8).toBe(0);
  });

  it('estimates credits based on quality preset', () => {
    expect(estimateCredits('draft')).toBe(1);
    expect(estimateCredits('standard', 2)).toBe(6);
    expect(estimateCredits('ultra')).toBe(20);
  });

  it('generates deterministic collection seeds', () => {
    const first = generateCollectionSeeds('nebula', 3);
    const second = generateCollectionSeeds('nebula', 3);
    expect(first).toEqual(second);
  });

  it('validates API key format', () => {
    expect(isValidApiKey('plk_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCD')).toBe(true);
    expect(isValidApiKey('invalid')).toBe(false);
  });
});
