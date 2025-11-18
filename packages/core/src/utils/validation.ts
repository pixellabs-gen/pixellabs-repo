import { z } from 'zod';
import { GenerationRequest, GenerationResult } from '../types/index.js';

/**
 * Validates a raw prompt and applies Synthetix Vision semantic enhancement.
 *
 * The NLP layer automatically injects high-yield artistic modifiers to
 * maximize generation quality without requiring manual prompt engineering.
 */

const QUALITY_MODIFIERS: Record<string, string[]> = {
  standard: ['high quality', 'detailed'],
  high: ['highly detailed', 'professional', '8k resolution', 'sharp focus'],
  ultra: [
    'masterpiece',
    'best quality',
    'volumetric lighting',
    'octane render',
    '8k',
    'ultra detailed',
    'photorealistic',
  ],
};

const NEGATIVE_PROMPT_DEFAULTS = [
  'blurry',
  'low quality',
  'jpeg artifacts',
  'watermark',
  'signature',
  'cropped',
  'poorly drawn',
  'deformed',
  'ugly',
  'bad anatomy',
].join(', ');

/**
 * Enhances a user prompt with quality modifiers based on the selected preset.
 *
 * @param prompt - Raw user prompt
 * @param quality - Quality preset to apply
 * @returns Enhanced prompt string
 */
export function enhancePrompt(prompt: string, quality: string): string {
  const modifiers = QUALITY_MODIFIERS[quality] ?? QUALITY_MODIFIERS.standard;
  const modifierString = modifiers.join(', ');
  return `${prompt.trim()}, ${modifierString}`;
}

/**
 * Merges user-supplied negative prompt with sensible defaults.
 *
 * @param userNegative - Optional user-provided negative prompt
 * @returns Combined negative prompt
 */
export function buildNegativePrompt(userNegative?: string): string {
  if (!userNegative) return NEGATIVE_PROMPT_DEFAULTS;
  return `${userNegative}, ${NEGATIVE_PROMPT_DEFAULTS}`;
}

/**
 * Validates an API key format (Bearer token, 64 hex chars).
 *
 * @param apiKey - API key to validate
 * @returns true if valid format
 */
export function isValidApiKey(apiKey: string): boolean {
  return /^plk_[a-zA-Z0-9]{48}$/.test(apiKey);
}

/**
 * Computes the output resolution from an aspect ratio string.
 *
 * @param aspectRatio - Aspect ratio string (e.g., '1:1', '16:9')
 * @param baseSize - Base dimension in pixels (default: 1024)
 * @returns Width and height in pixels
 */
export function aspectRatioToResolution(
  aspectRatio: string,
  baseSize = 1024
): { width: number; height: number } {
  const [wRaw, hRaw] = aspectRatio.split(':').map(Number);
  const w = wRaw ?? 1;
  const h = hRaw ?? 1;
  const scale = Math.sqrt((baseSize * baseSize) / (w * h));
  return {
    width: Math.round((w * scale) / 8) * 8,
    height: Math.round((h * scale) / 8) * 8,
  };
}

/**
 * Generates a deterministic collection seed from a base prompt and count.
 * Used for reproducible batch generation.
 *
 * @param basePrompt - Base prompt for the collection
 * @param count - Number of items in the collection
 * @returns Array of unique generation seeds
 */
export function generateCollectionSeeds(basePrompt: string, count: number): number[] {
  let hash = 0;
  for (let i = 0; i < basePrompt.length; i++) {
    hash = ((hash << 5) - hash + basePrompt.charCodeAt(i)) | 0;
  }
  return Array.from({ length: count }, (_, i) => Math.abs(hash + i * 2654435769) >>> 0);
}

/**
 * Estimates the number of generation credits required for a request.
 *
 * Credit pricing:
 * - Draft:    1 credit
 * - Standard: 3 credits
 * - High:     8 credits
 * - Ultra:    20 credits
 *
 * @param quality - Quality preset
 * @param count - Number of images (for batch operations)
 * @returns Total credits required
 */
export function estimateCredits(quality: string, count = 1): number {
  const creditMap: Record<string, number> = {
    draft: 1,
    standard: 3,
    high: 8,
    ultra: 20,
  };
  return (creditMap[quality] ?? 3) * count;
}