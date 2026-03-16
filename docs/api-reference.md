# PixelLabs API Reference

Base URL (production):

```
https://api.pixellabs.ai
```

All requests use JSON and require a `Bearer` API token.

```
Authorization: Bearer <PIXELLABS_API_KEY>
Content-Type: application/json
```

## Generate Image

`POST /v1/generate`

### Request

```json
{
  "prompt": "cyberpunk samurai, volumetric lighting, octane render, 8k",
  "negative_prompt": "blurry, distorted",
  "model": "synthetix-v2",
  "steps": 50,
  "guidance_scale": 7.5,
  "width": 1024,
  "height": 1024,
  "seed": 123456,
  "priority": 0.5
}
```

### Response

```json
{
  "id": "e2b2f8af-9176-4bd2-92f8-4f6b22b3537f",
  "content_hash": "7a84c0e1d5d79f2d05f4c0f19d9f0b0f1d2af9f81d4a6331c1f73a1b3c9341c2",
  "image_base64": "<base64 png bytes>",
  "metadata": {
    "inference_time_ms": 1825,
    "steps_completed": 50,
    "seed": 123456,
    "generated_at_ms": 1700000000000,
    "clip_score": 0.81,
    "aesthetic_score": 6.8
  }
}
```

## Batch Generate

`POST /v1/generate/batch`

### Request

```json
{
  "base_prompt": "pixel astronaut, soft glow",
  "variations": ["orange nebula", "violet nebula", "emerald nebula"],
  "count": 3,
  "config": {
    "model": "synthetix-v2",
    "steps": 60,
    "guidance_scale": 8,
    "width": 1024,
    "height": 1024
  }
}
```

### Response

```json
{
  "job_id": "b2a9b8a2-ef0a-47c6-8f8f-3c8d6c9c4fb2",
  "status": "queued",
  "estimated_completion_at": "2026-03-16T10:20:30Z"
}
```

## Job Status

`GET /v1/jobs/{jobId}`

### Response

```json
{
  "id": "b2a9b8a2-ef0a-47c6-8f8f-3c8d6c9c4fb2",
  "status": "processing",
  "progress": 0.42,
  "results": [],
  "createdAt": "2026-03-16T10:18:00Z",
  "updatedAt": "2026-03-16T10:19:00Z"
}
```

## Usage

`GET /v1/usage`

### Response

```json
{
  "creditsUsed": 1240,
  "creditsRemaining": 8760,
  "requestsThisMinute": 32,
  "requestsThisHour": 410,
  "rateLimits": {
    "requestsPerMinute": 120,
    "requestsPerHour": 2000
  },
  "resetAt": "2026-03-16T11:00:00Z"
}
```

## Error Responses

All errors return a consistent JSON envelope:

```json
{
  "error": {
    "code": "RATE_LIMIT_ERROR",
    "message": "Rate limit exceeded",
    "details": {
      "retryAfter": 60
    }
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`
- `RATE_LIMIT_ERROR`
- `INSUFFICIENT_CREDITS`
- `API_ERROR`
- `NETWORK_ERROR`

## Rate Limit Headers

Responses may include:

- `Retry-After` (seconds)
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
