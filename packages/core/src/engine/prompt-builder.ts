import { QualityPreset } from '../types/index.js';

export type PromptEnhancementInput = {
  prompt: string;
  quality?: QualityPreset;
  styleTags?: string[];
  negativePrompt?: string;
  maxLength?: number;
};

export type PromptEnhancementOutput = {
  prompt: string;
  negativePrompt: string;
  warnings: string[];
};

const QUALITY_MODIFIERS: Record<QualityPreset, string[]> = {
  [QualityPreset.DRAFT]: ['clean composition', 'balanced lighting'],
  [QualityPreset.STANDARD]: ['high quality', 'detailed'],
  [QualityPreset.HIGH]: ['highly detailed', 'professional', '8k resolution', 'sharp focus'],
  [QualityPreset.ULTRA]: [
    'masterpiece',
    'best quality',
    'volumetric lighting',
    'octane render',
    'ultra detailed',
    'photorealistic',
  ],
};

const NEGATIVE_PROMPT_BASE = [
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
];

export class PromptBuilder {
  private prompt: string;
  private quality: QualityPreset;
  private styleTags: string[];
  private negativePrompt: string | undefined;
  private maxLength: number;

  constructor(input: PromptEnhancementInput) {
    this.prompt = input.prompt;
    this.quality = input.quality ?? QualityPreset.STANDARD;
    this.styleTags = input.styleTags ?? [];
    this.negativePrompt = input.negativePrompt;
    this.maxLength = input.maxLength ?? 2000;
  }

  withQuality(quality: QualityPreset): PromptBuilder {
    this.quality = quality;
    return this;
  }

  withStyleTags(tags: string[]): PromptBuilder {
    this.styleTags = tags;
    return this;
  }

  withNegativePrompt(negativePrompt: string | undefined): PromptBuilder {
    this.negativePrompt = negativePrompt;
    return this;
  }

  withMaxLength(maxLength: number): PromptBuilder {
    this.maxLength = maxLength;
    return this;
  }

  build(): PromptEnhancementOutput {
    const warnings: string[] = [];
    const normalized = this.normalizePrompt(this.prompt);
    const modifiers = QUALITY_MODIFIERS[this.quality] ?? QUALITY_MODIFIERS[QualityPreset.STANDARD];
    const styleTagString = this.styleTags.filter(Boolean).join(', ');

    const mergedPrompt = [normalized, ...modifiers, styleTagString]
      .filter((segment) => segment && segment.length > 0)
      .join(', ');

    if (mergedPrompt.length > this.maxLength) {
      warnings.push('Prompt was truncated to fit the maximum length.');
    }

    const prompt = mergedPrompt.slice(0, this.maxLength).trim();
    const negativePrompt = this.mergeNegativePrompt(this.negativePrompt);

    return { prompt, negativePrompt, warnings };
  }

  private normalizePrompt(prompt: string): string {
    return prompt
      .split(',')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .join(', ');
  }

  private mergeNegativePrompt(userNegative?: string): string {
    if (!userNegative || userNegative.trim().length === 0) {
      return NEGATIVE_PROMPT_BASE.join(', ');
    }
    const normalized = userNegative
      .split(',')
      .map((segment) => segment.trim())
      .filter(Boolean);
    const merged = [...normalized, ...NEGATIVE_PROMPT_BASE];
    return Array.from(new Set(merged)).join(', ');
  }
}

export function buildEnhancedPrompt(input: PromptEnhancementInput): PromptEnhancementOutput {
  return new PromptBuilder(input).build();
}
