# Inference Engine Design

The inference engine is the Rust core responsible for prompt encoding, diffusion scheduling, and image post-processing for Synthetix Vision Architecture.

## Architecture Overview

The pipeline is divided into deterministic stages:

1. Prompt encoding (CLIP tokenization + embedding normalization)
2. Latent initialization (seeded noise generation)
3. Diffusion scheduling (DDIM-style denoising loop)
4. VAE decoding (latent to pixel space)
5. Post-processing (color correction, metadata, IPFS preparation)

## Key Modules

- `encoder.rs`: prompt tokenization, token budget enforcement, embedding normalization
- `pipeline.rs`: diffusion steps, guidance, sampling and metrics capture
- `scheduler.rs`: distributed scheduling and concurrency control for edge nodes
- `postprocess.rs`: format conversion, hash generation, metadata
- `error.rs`: canonical error types for the engine

## Telemetry

Telemetry is collected per step and aggregated into `InferenceMetrics`. The output includes:

- `clip_score`: prompt-image alignment
- `aesthetic_score`: model quality score
- `peak_gpu_memory_mib`: resource usage
- `encoder_throughput`: tokens/sec
- `step_latency_ms`: per-step timing for performance analysis

## Determinism Strategy

- A resolved seed is always captured in `InferenceResult`
- Latent dimensions and output resolution are normalized to multiples of 8
- Scheduler decisions are deterministic per-request when using fixed seeds

## Execution Notes

This repository does not ship GPU kernels. The current code simulates the pipeline and focuses on structural correctness, tracing, and metrics scaffolding that can be wired to ONNX or CUDA runtimes.
