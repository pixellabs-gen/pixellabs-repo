# PixelLabs SDK Usage

This document describes how to integrate the PixelLabs TypeScript SDK in production services.

## Installation

```
npm install @pixellabs/sdk
```

## Initialization

```
import { PixelLabsSdk } from '@pixellabs/sdk';

const sdk = new PixelLabsSdk({
  apiKey: process.env.PIXELLABS_API_KEY,
});
```

## Generate a Single Asset

```
const result = await sdk.generate({
  prompt: 'mecha koi fish, chrome scales, 8k',
  model: 'synthetix-v2',
  aspectRatio: '1:1',
  quality: 'high',
  steps: 60,
  guidanceScale: 7.6,
});

console.log(result.imageUrl);
```

## Generate a Batch Collection

```
const results = await sdk.generateBatch({
  basePrompt: 'cathedral of light, stained glass, volumetric haze',
  variations: ['sunrise palette', 'midnight palette', 'aurora palette'],
  count: 3,
  config: {
    prompt: 'cathedral of light, stained glass, volumetric haze',
    model: 'synthetix-v2',
    aspectRatio: '3:4',
    quality: 'ultra',
    steps: 70,
    guidanceScale: 7.8,
  },
});

console.log(results.map((item) => item.ipfsHash));
```

## Job Status and Usage

```
const usage = await sdk.getUsage();
console.log(usage.creditsRemaining);

const job = await sdk.getJobStatus('job_123');
console.log(job.status, job.progress);
```

## Credit Estimation

```
const estimated = sdk.estimateCredits('ultra', 5);
console.log(`Estimated credits: ${estimated}`);
```

## Minting Integration

```
import { Wallet } from 'ethers';

const signer = new Wallet(process.env.MINTER_PRIVATE_KEY, provider);
const sdk = new PixelLabsSdk({
  apiKey: process.env.PIXELLABS_API_KEY,
  minting: {
    contractAddress: '0xYourContractAddress',
    signer,
  },
});

const tx = await sdk.minting?.mintWithMetadata('0xRecipient', {
  name: 'Neon Artifact #1',
  description: 'First artifact in the Neon Archive collection',
  image: 'ipfs://bafy...',
  attributes: [{ trait_type: 'Palette', value: 'Midnight' }],
});

console.log(tx?.hash);
```
