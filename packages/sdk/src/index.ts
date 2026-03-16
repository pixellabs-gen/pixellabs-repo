import {
  BatchGenerationRequest,
  GenerationClient,
  GenerationClientConfig,
  GenerationRequest,
  GenerationResult,
} from '@pixellabs/core';
import { MintingClient, MintingConfig } from './minting.js';

export interface PixelLabsSdkConfig extends GenerationClientConfig {
  minting?: MintingConfig;
}

export class PixelLabsSdk {
  readonly generation: GenerationClient;
  readonly minting?: MintingClient;

  constructor(config: PixelLabsSdkConfig) {
    this.generation = new GenerationClient(config);
    if (config.minting) {
      this.minting = new MintingClient(config.minting);
    }
  }

  generate(request: GenerationRequest): Promise<GenerationResult> {
    return this.generation.generate(request);
  }

  generateBatch(request: BatchGenerationRequest): Promise<GenerationResult[]> {
    return this.generation.generateBatch(request);
  }
}

export * from './minting.js';
