import { z } from 'zod';
import {
  GenerationRequest,
  GenerationRequestSchema,
  GenerationResult,
  BatchGenerationRequest,
  GenerationError,
  ValidationError,
  RateLimitError,
  InsufficientCreditsError,
  GenerationModel,
  AspectRatio,
  QualityPreset,
} from './types/index.js';

const RETRY_STATUS_CODES = new Set([429, 502, 503, 504]);
const DEFAULT_ENDPOINT = 'https://api.pixellabs.ai';

/**
 * Configuration for the PixelLabs generation client
 */
export interface GenerationClientConfig {
  /** API authentication key */
  apiKey: string;
  /** Override API endpoint (default: production) */
  endpoint?: string;
  /** Request timeout in milliseconds (default: 60000) */
  timeout?: number;
  /** Maximum number of retry attempts for transient errors (default: 3) */
  retries?: number;
  /** Base delay in ms for exponential backoff (default: 1000) */
  retryBaseDelay?: number;
}

/**
 * The PixelLabs generation client.
 *
 * Provides a type-safe interface to the Synthetix Vision Architecture API
 * for single-image and batch NFT generation workflows.
 *
 * @example
 * ```typescript
 * const client = new GenerationClient({ apiKey: process.env.PIXELLABS_API_KEY! });
 *
 * const result = await client.generate({
 *   prompt: 'cyberpunk samurai, volumetric lighting, octane render, 8k',
 *   model: GenerationModel.SYNTHETIX_V2,
 *   quality: QualityPreset.ULTRA,
 * });
 *
 * console.log(result.imageUrl);
 * ```
 */
export class GenerationClient {
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly retries: number;
  private readonly retryBaseDelay: number;

  constructor(config: GenerationClientConfig) {
    if (!config.apiKey) {
      throw new ValidationError('apiKey is required');
    }

    this.apiKey = config.apiKey;
    this.endpoint = (config.endpoint ?? DEFAULT_ENDPOINT).replace(/\/$/, '');
    this.timeout = config.timeout ?? 60_000;
    this.retries = config.retries ?? 3;
    this.retryBaseDelay = config.retryBaseDelay ?? 1_000;
  }

  /**
   * Generates a single image from a text prompt.
   *
   * @param request - Generation parameters
   * @returns Resolved generation result with signed image URL and IPFS hash
   * @throws {ValidationError} If request parameters are invalid
   * @throws {RateLimitError} If API rate limits are exceeded
   * @throws {InsufficientCreditsError} If account has insufficient credits
   */
  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const validated = GenerationRequestSchema.safeParse(request);
    if (!validated.success) {
      throw new ValidationError('Invalid generation request', validated.error.flatten());
    }

    return this.executeWithRetry<GenerationResult>(
      '/v1/generate',
      'POST',
      validated.data
    );
  }

  /**
   * Generates a batch of images from a base prompt with programmatic variations.
   * Suitable for minting entire NFT collections.
   *
   * @param request - Batch generation parameters
   * @returns Array of resolved generation results
   */
  async generateBatch(request: BatchGenerationRequest): Promise<GenerationResult[]> {
    if (request.count < 1 || request.count > 10_000) {
      throw new ValidationError('Batch count must be between 1 and 10,000');
    }

    return this.executeWithRetry<GenerationResult[]>(
      '/v1/generate/batch',
      'POST',
      request
    );
  }

  /**
   * Polls for the status of an async generation job.
   *
   * @param jobId - Job ID returned from a batch generation request
   * @returns Current job status and results (if complete)
   */
  async getJobStatus(jobId: string): Promise<JobStatus> {
    return this.executeWithRetry<JobStatus>(`/v1/jobs/${jobId}`, 'GET');
  }

  /**
   * Returns current API usage and rate limit information for the configured key.
   */
  async getUsage(): Promise<UsageInfo> {
    return this.executeWithRetry<UsageInfo>('/v1/usage', 'GET');
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async executeWithRetry<T>(
    path: string,
    method: string,
    body?: unknown
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        return await this.execute<T>(path, method, body);
      } catch (error) {
        if (error instanceof RateLimitError) {
          const delay = error.retryAfter * 1_000;
          await sleep(delay);
          lastError = error;
          continue;
        }

        if (error instanceof GenerationError) {
          // Non-retriable domain errors — propagate immediately
          throw error;
        }

        if (attempt < this.retries) {
          const delay = this.retryBaseDelay * Math.pow(2, attempt);
          await sleep(delay + Math.random() * 200);
          lastError = error as Error;
          continue;
        }

        throw error;
      }
    }

    throw lastError ?? new GenerationError('Max retries exceeded', 'MAX_RETRIES_EXCEEDED');
  }

  private async execute<T>(path: string, method: string, body?: unknown): Promise<T> {
    const url = `${this.endpoint}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Pixellabs-SDK': '0.1.0',
          'X-Pixellabs-SDK-Language': 'typescript',
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof GenerationError) throw error;
      if ((error as { name?: string }).name === 'AbortError') {
        throw new GenerationError(
          `Request timed out after ${this.timeout}ms`,
          'TIMEOUT'
        );
      }
      throw new GenerationError(
        `Network error: ${(error as Error).message}`,
        'NETWORK_ERROR'
      );
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    const body = await response.json().catch(() => ({})) as ErrorBody;
    const message = body?.error?.message ?? response.statusText;

    if (response.status === 402) {
      throw new InsufficientCreditsError(message, body?.error?.details?.creditsRequired ?? 0);
    }

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get('Retry-After') ?? 60);
      throw new RateLimitError(message, retryAfter);
    }

    if (response.status === 400) {
      throw new ValidationError(message, body?.error?.details);
    }

    throw new GenerationError(message, body?.error?.code ?? 'API_ERROR');
  }
}

// ---------------------------------------------------------------------------
// Additional response types
// ---------------------------------------------------------------------------

export interface JobStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  results?: GenerationResult[];
  error?: { code: string; message: string };
  createdAt: string;
  updatedAt: string;
  estimatedCompletionAt?: string;
}

export interface UsageInfo {
  creditsUsed: number;
  creditsRemaining: number;
  requestsThisMinute: number;
  requestsThisHour: number;
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  resetAt: string;
}

interface ErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
