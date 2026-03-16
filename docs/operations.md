# Operations Guide

This document outlines operational considerations for PixelLabs deployments.

## Runtime Configuration

Recommended environment variables:

```
PIXELLABS_API_ENDPOINT=https://api.pixellabs.ai
PIXELLABS_LOG_LEVEL=info
PIXELLABS_MAX_CONCURRENCY=32
```

## Edge Node Requirements

- Linux x86_64
- Rust stable toolchain
- GPU (optional, depending on runtime backend)
- 8+ vCPUs, 32GB RAM for burst workloads

## Observability

Recommended telemetry signals:

- Request latency (p50, p95, p99)
- Generation success/failure rate
- GPU memory usage
- Queue depth and scheduling latency

## Incident Response

- Disable traffic routing to unhealthy nodes
- Rotate API keys when secrets are suspected compromised
- Capture request IDs for forensic analysis
