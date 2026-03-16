import {
  BatchGenerationRequest,
  estimateCredits,
  GenerationClient,
  GenerationClientConfig,
  GenerationRequest,
  GenerationResult,
  JobStatus,
  UsageInfo,
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

  estimateCredits(quality: string, count = 1): number {
    return estimateCredits(quality, count);
  }

  getJobStatus(jobId: string): Promise<JobStatus> {
    return this.generation.getJobStatus(jobId);
  }

  getUsage(): Promise<UsageInfo> {
    return this.generation.getUsage();
  }
}

export * from './minting.js';
