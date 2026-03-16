# Core Package Architecture

The core package provides the TypeScript API client, request validation, and prompt enhancement utilities for PixelLabs.

## Modules

- `client.ts`: HTTP client with retry policy, rate-limit handling, and timeout control
- `types/index.ts`: shared types for requests, responses, and domain errors
- `utils/validation.ts`: request validation, prompt enhancement defaults, and credit estimation
- `engine/prompt-builder.ts`: prompt normalization and quality modifier pipeline

## Error Strategy

Domain-specific errors extend `GenerationError` to preserve error codes and structured details.

- `ValidationError`: invalid request payloads
- `RateLimitError`: API throttling with retry-after
- `InsufficientCreditsError`: credit balance errors

## Prompt Enhancement Pipeline

The prompt builder is designed to be deterministic and auditable:

1. Normalize prompt segments
2. Append quality modifiers based on preset
3. Merge optional style tags
4. Merge negative prompt defaults with user input
5. Truncate to maximum length if required

## Extensibility

The client is designed for extension via a shared `GenerationClientConfig` and can be wrapped for specialized flows in the SDK or CLI.
