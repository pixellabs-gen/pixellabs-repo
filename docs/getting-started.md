# Getting Started

This guide walks through the minimal workflow for generating assets and preparing them for minting.

## Prerequisites

- Node.js 18+
- npm 9+
- A PixelLabs API key

## Quick Workflow

1. Install dependencies for the workspace.
2. Configure your API key as an environment variable.
3. Generate a single image to validate the pipeline.
4. Generate a batch with variations for collection-scale output.
5. Prepare metadata for minting.

## Environment Setup

Set your API key in the shell before running the CLI or SDK.

```
PIXELLABS_API_KEY=plk_your_api_key_here
```

## CLI Example

```
node packages/cli/dist/cli.js generate \
  --prompt "cyberpunk oni mask, volumetric lighting" \
  --model synthetix-v2 \
  --quality high
```

## SDK Example

```
import { PixelLabsSdk } from '@pixellabs/sdk';

const sdk = new PixelLabsSdk({
  apiKey: process.env.PIXELLABS_API_KEY,
});

const result = await sdk.generate({
  prompt: 'retro-futuristic city skyline, neon haze, 8k',
  model: 'synthetix-v2',
  aspectRatio: '16:9',
  quality: 'ultra',
  steps: 60,
  guidanceScale: 7.8,
});

console.log(result.imageUrl);
```

## Batch Generation Example

```
const results = await sdk.generateBatch({
  basePrompt: 'astro botanist in a glass dome',
  variations: ['midnight palette', 'aurora palette', 'sunset palette'],
  count: 3,
  config: {
    prompt: 'astro botanist in a glass dome',
    model: 'synthetix-v2',
    aspectRatio: '1:1',
    quality: 'high',
    steps: 50,
    guidanceScale: 7.2,
  },
});

console.log(results.map((item) => item.ipfsHash));
```

## Next Steps

- Review `docs/architecture.md` for system design details.
- Use `packages/sdk/USAGE.md` to integrate the SDK in your app.
- Use `packages/cli/USAGE.md` for CLI command reference.
