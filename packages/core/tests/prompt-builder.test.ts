import { describe, expect, it } from 'vitest';
import { buildEnhancedPrompt, PromptBuilder } from '../src/engine/index.js';
import { QualityPreset } from '../src/types/index.js';

const BASE_PROMPT = 'neon temple, reflective floor';

describe('PromptBuilder', () => {
  it('applies quality modifiers and style tags', () => {
    const result = buildEnhancedPrompt({
      prompt: BASE_PROMPT,
      quality: QualityPreset.HIGH,
      styleTags: ['cinematic lighting', 'ultra sharp'],
    });

    expect(result.prompt).toContain('highly detailed');
    expect(result.prompt).toContain('cinematic lighting');
    expect(result.prompt).toContain('ultra sharp');
  });

  it('deduplicates negative prompt tokens', () => {
    const builder = new PromptBuilder({
      prompt: BASE_PROMPT,
      negativePrompt: 'blurry, watermark, oversaturated',
    });

    const { negativePrompt } = builder.build();
    const parts = negativePrompt.split(',').map((item) => item.trim());
    const unique = new Set(parts);

    expect(parts.length).toBe(unique.size);
    expect(negativePrompt).toContain('oversaturated');
    expect(negativePrompt).toContain('watermark');
  });

  it('truncates prompts that exceed the max length', () => {
    const result = buildEnhancedPrompt({
      prompt: 'a'.repeat(200),
      maxLength: 50,
    });

    expect(result.prompt.length).toBe(50);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
