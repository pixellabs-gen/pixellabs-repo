# PixelLabs Architecture

## Overview

PixelLabs is composed of three primary layers:

- **Client SDKs** that validate prompts, handle retries, and provide minting helpers.
- **Edge inference services** that execute the Synthetix Vision pipeline close to end-users.
- **Metadata + delivery services** that package outputs into NFT-ready assets and chain metadata.

The platform is designed for low-latency generation, bursty collection minting, and strict
data isolation for creator prompts.

## High-Level Components

1. **Generation API**
   - Receives generation requests.
   - Performs validation, auth, and routing.
   - Queues requests for inference and returns job metadata.

2. **Inference Engine**
   - Executes denoising steps with the Synthetix pipeline.
   - Applies prompt embeddings, guidance scale, and model variant logic.
   - Produces raw image bytes and quality metrics.

3. **Post-Processing**
   - Encodes assets for delivery (PNG + base64).
   - Produces content hashes for deduplication.
   - Emits metadata payloads compatible with ERC-721/ERC-1155.

4. **Metadata + Storage**
   - Builds collection metadata JSON.
   - Pins assets to IPFS (production integration).
   - Stores job status and usage metrics.

## Data Flow

```
Client SDK/CLI
    |
    | 1) /v1/generate (prompt + config)
    v
Generation API
    |
    | 2) queue request
    v
Scheduler  --->  Inference Pipeline  --->  Post-Process
    |                 |                       |
    | 3) metrics      | 4) image bytes       | 5) base64 + metadata
    v                 v                       v
Usage Store        Content Hash            NFT Metadata
```

## Reliability Strategy

- **Retries + Backoff**: transient failures are retried with exponential backoff.
- **Queue Backpressure**: max queue size and TTL guardrails.
- **Idempotent Job IDs**: clients can safely re-fetch job status.

## Security Posture

- API keys are scoped and rate limited.
- Prompt data is isolated per request lifecycle.
- Content hashes ensure tamper detection for delivered assets.
