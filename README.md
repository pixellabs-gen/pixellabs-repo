![PixelLabs Banner](public/image.jpg)

[![Website](https://img.shields.io/badge/Website-pixellabsai.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://pixellabsai.app)
[![Docs](https://img.shields.io/badge/Docs-docs.pixellabsai.app-000000?style=for-the-badge&logo=read-the-docs&logoColor=white)](https://docs.pixellabsai.app)
[![X](https://img.shields.io/badge/X-%40PixelLabsCore-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/PixelLabsCore)

<br/>

![Solana](https://img.shields.io/badge/Solana-14F195?style=flat-square&logo=solana&logoColor=black)
![Rust](https://img.shields.io/badge/Rust-000000?style=flat-square&logo=rust&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Web3](https://img.shields.io/badge/Web3-F16822?style=flat-square)
![AI](https://img.shields.io/badge/AI-4B0082?style=flat-square)
![NFT](https://img.shields.io/badge/NFT-FF007A?style=flat-square)
![Omnichain](https://img.shields.io/badge/Omnichain-8C8C8C?style=flat-square)
![SDK](https://img.shields.io/badge/SDK-FFB020?style=flat-square)
![CLI](https://img.shields.io/badge/CLI-FF4D4D?style=flat-square)
![Generative Art](https://img.shields.io/badge/Generative_Art-9932CC?style=flat-square)

# PixelLabs

PixelLabs is a next-generation AI NFT generation platform that combines a high-performance Rust inference engine with a TypeScript SDK and CLI. The system focuses on prompt-driven generation, collection-scale batching, and omnichain-ready outputs for Web3 workflows.

## Features

- Synthetix Vision prompt pipeline with quality presets and negative prompting
- Omnichain generation flows for multi-network minting pipelines
- Type-safe TypeScript SDK and CLI for automation
- Rust inference engine scaffolding with deterministic metrics
- Documentation-first workflow and API reference

## Quick Start

### SDK

```
import { PixelLabsSdk } from '@pixellabs/sdk';

const sdk = new PixelLabsSdk({
  apiKey: process.env.PIXELLABS_API_KEY,
});

const result = await sdk.generate({
  prompt: 'neon sanctuary, cinematic haze, 8k',
  model: 'synthetix-v2',
  aspectRatio: '16:9',
  quality: 'high',
  steps: 60,
  guidanceScale: 7.6,
});

console.log(result.imageUrl);
```

### CLI

```
node packages/cli/dist/cli.js generate \
  --prompt "neon sanctuary, cinematic haze" \
  --model synthetix-v2 \
  --quality high
```

## Packages

- `packages/core`: generation client, types, and prompt enhancement utilities
- `packages/sdk`: SDK wrapper for generation and minting workflows
- `packages/cli`: CLI for prompt-driven generation
- `packages/inference-engine`: Rust inference engine scaffolding

## Documentation

- `docs/getting-started.md`
- `docs/architecture.md`
- `docs/api-reference.md`
- `docs/operations.md`
- `packages/sdk/USAGE.md`
- `packages/cli/USAGE.md`
- `packages/inference-engine/DESIGN.md`

## Repository Layout

```
.
├── .github
│   ├── ISSUE_TEMPLATE
│   ├── workflows
│   ├── CODEOWNERS
│   └── PULL_REQUEST_TEMPLATE.md
├── docs
│   ├── api-reference.md
│   ├── architecture.md
│   ├── getting-started.md
│   ├── index.md
│   └── operations.md
├── packages
│   ├── cli
│   │   ├── src
│   │   └── USAGE.md
│   ├── core
│   │   ├── src
│   │   ├── tests
│   │   └── ARCHITECTURE.md
│   ├── inference-engine
│   │   ├── src
│   │   └── DESIGN.md
│   └── sdk
│       ├── src
│       └── USAGE.md
├── public
│   └── image.jpg
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
├── package.json
├── tsconfig.json
└── turbo.json
```

## Development

```
npm install
npm run lint
npm run test
npm run build
```

## Security

See `SECURITY.md` for vulnerability reporting and security practices.

## Contributing

See `CONTRIBUTING.md` for the development workflow and pull request expectations.
