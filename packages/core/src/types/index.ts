import { z } from 'zod';

/**
 * Supported image generation models
 */
export enum GenerationModel {
  SYNTHETIX_V1 = 'synthetix-v1',
  SYNTHETIX_V2 = 'synthetix-v2',
  DIFFUSION_XL = 'diffusion-xl',
}

/**
 * Image aspect ratios supported by the generation engine
 */
export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '3:4',
  LANDSCAPE = '4:3',
  WIDE = '16:9',
  ULTRA_WIDE = '21:9',
}

/**
 * Generation quality presets
 */
export enum QualityPreset {
  DRAFT = 'draft',
  STANDARD = 'standard',
  HIGH = 'high',
  ULTRA = 'ultra',
}

/**
 * Blockchain networks supported for NFT deployment
 */
export enum SupportedChain {
  ETHEREUM = 'ethereum',
  POLYGON = 'polygon',
  BSC = 'bsc',
  AVALANCHE = 'avalanche',
  ARBITRUM = 'arbitrum',
  OPTIMISM = 'optimism',
}

/**
 * Generation request schema validation
 */
export const GenerationRequestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  negativePrompt: z.string().max(1000).optional(),
  model: z.nativeEnum(GenerationModel).default(GenerationModel.SYNTHETIX_V2),
  aspectRatio: z.nativeEnum(AspectRatio).default(AspectRatio.SQUARE),
  quality: z.nativeEnum(QualityPreset).default(QualityPreset.STANDARD),
  seed: z.number().int().positive().optional(),
  steps: z.number().int().min(10).max(150).default(50),
  guidanceScale: z.number().min(1).max(20).default(7.5),
});

export type GenerationRequest = z.infer<typeof GenerationRequestSchema>;

/**
 * Generation result interface
 */
export interface GenerationResult {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  metadata: {
    prompt: string;
    negativePrompt?: string;
    model: GenerationModel;
    aspectRatio: AspectRatio;
    quality: QualityPreset;
    seed: number;
    steps: number;
    guidanceScale: number;
    generatedAt: Date;
    processingTime: number;
  };
  ipfsHash?: string;
}

/**
 * Batch generation request
 */
export interface BatchGenerationRequest {
  basePrompt: string;
  variations: string[];
  count: number;
  config: Omit<GenerationRequest, 'prompt'>;
}

/**
 * NFT metadata standard (ERC-721/ERC-1155 compatible)
 */
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: 'boost_number' | 'boost_percentage' | 'number' | 'date';
  }>;
  background_color?: string;
  animation_url?: string;
  youtube_url?: string;
}

/**
 * Error types for the generation engine
 */
export class GenerationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'GenerationError';
  }
}

export class ValidationError extends GenerationError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

export class RateLimitError extends GenerationError {
  constructor(message: string, public retryAfter: number) {
    super(message, 'RATE_LIMIT_ERROR', { retryAfter });
  }
}

export class InsufficientCreditsError extends GenerationError {
  constructor(message: string, public creditsRequired: number) {
    super(message, 'INSUFFICIENT_CREDITS', { creditsRequired });
  }
}