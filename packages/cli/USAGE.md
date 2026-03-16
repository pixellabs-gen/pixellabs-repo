# PixelLabs CLI Usage

The PixelLabs CLI wraps the core generation API for quick prompt-driven workflows.

## Install and Build

```
npm install
npm run build -w packages/cli
```

## Environment

Set your API key before running the CLI:

```
PIXELLABS_API_KEY=plk_your_api_key_here
```

## Generate a Single Image

```
node packages/cli/dist/cli.js generate \
  --prompt "crystal canyon, cinematic fog, octane render" \
  --model synthetix-v2 \
  --aspect 16:9 \
  --quality high
```

## Batch Generation

```
node packages/cli/dist/cli.js batch \
  --base-prompt "celestial archive, floating glyphs" \
  --variations "midnight palette, aurora palette, solar flare" \
  --count 3 \
  --quality ultra
```

## Usage and Status

```
node packages/cli/dist/cli.js usage
node packages/cli/dist/cli.js status job_123
```

## JSON Output

Use `--json` with any command to return the raw JSON response for scripting:

```
node packages/cli/dist/cli.js generate --prompt "neon basilica" --json
```
