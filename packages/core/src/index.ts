/**
 * @pixellabs/core - AI Image Generation Engine
 * 
 * Core library for the PixelLabs AI NFT generation platform.
 * Provides type-safe interfaces and utilities for image generation,
 * prompt enhancement, and blockchain integration.
 */

// Export all types
export * from './types/index.js';

// Export utilities
export * from './utils/validation.js';

// Export the API client
export { GenerationClient } from './client.js';
export type { GenerationClientConfig } from './client.js';

// Version info
export const VERSION = '0.1.0';
export const API_VERSION = 'v1';

/**
 * Core configuration interface
 */
export interface CoreConfig {
  apiKey?: string;
  endpoint?: string;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Required<CoreConfig> = {
  apiKey: '',
  endpoint: 'https://api.pixellabs.ai',
  timeout: 30000,
  retries: 3,
  debug: false,
};
