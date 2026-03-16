#!/usr/bin/env node
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import {
  AspectRatio,
  GenerationClient,
  GenerationModel,
  QualityPreset,
} from '@pixellabs/core';

const program = new Command();

program
  .name('pixellabs')
  .description('PixelLabs CLI for AI NFT generation')
  .version('0.1.0')
  .option('--api-key <key>', 'PixelLabs API key (or PIXELLABS_API_KEY env var)')
  .option('--endpoint <url>', 'Override API endpoint');

program
  .command('generate')
  .description('Generate a single image from a prompt')
  .option('--prompt <text>', 'Prompt for generation')
  .option('--negative <text>', 'Negative prompt')
  .option('--model <model>', 'Model: synthetix-v1|synthetix-v2|diffusion-xl', 'synthetix-v2')
  .option('--aspect <ratio>', 'Aspect ratio: 1:1|3:4|4:3|16:9|21:9', '1:1')
  .option('--quality <quality>', 'Quality: draft|standard|high|ultra', 'standard')
  .option('--steps <n>', 'Diffusion steps', parseInt)
  .option('--guidance <n>', 'Guidance scale', parseFloat)
  .option('--seed <n>', 'Random seed', parseInt)
  .option('--json', 'Output raw JSON')
  .action(async (options) => {
    const client = createClient(program.opts());
    const prompt = options.prompt ?? (await promptForText('Prompt'));
    const spinner = ora('Generating image...').start();
    try {
      const result = await client.generate({
        prompt,
        negativePrompt: options.negative,
        model: parseModel(options.model),
        aspectRatio: parseAspectRatio(options.aspect),
        quality: parseQuality(options.quality),
        steps: options.steps,
        guidanceScale: options.guidance,
        seed: options.seed,
      });
      spinner.succeed('Generation complete');
      printResult(result, options.json);
    } catch (error) {
      spinner.fail('Generation failed');
      handleError(error);
    }
  });

program
  .command('batch')
  .description('Generate a batch of images with variations')
  .option('--base-prompt <text>', 'Base prompt')
  .option('--variations <list>', 'Comma-separated variations')
  .option('--count <n>', 'Number of images to generate', parseInt)
  .option('--model <model>', 'Model: synthetix-v1|synthetix-v2|diffusion-xl', 'synthetix-v2')
  .option('--aspect <ratio>', 'Aspect ratio: 1:1|3:4|4:3|16:9|21:9', '1:1')
  .option('--quality <quality>', 'Quality: draft|standard|high|ultra', 'standard')
  .option('--steps <n>', 'Diffusion steps', parseInt)
  .option('--guidance <n>', 'Guidance scale', parseFloat)
  .option('--seed <n>', 'Random seed', parseInt)
  .option('--json', 'Output raw JSON')
  .action(async (options) => {
    const client = createClient(program.opts());
    const basePrompt = options.basePrompt ?? (await promptForText('Base prompt'));
    const variations = options.variations
      ? options.variations.split(',').map((item: string) => item.trim())
      : await promptForList('Variations (comma-separated)');
    const count = options.count ?? variations.length;
    const spinner = ora('Generating batch...').start();
    try {
      const result = await client.generateBatch({
        basePrompt,
        variations,
        count,
        config: {
          prompt: basePrompt,
          model: parseModel(options.model),
          aspectRatio: parseAspectRatio(options.aspect),
          quality: parseQuality(options.quality),
          steps: options.steps ?? 50,
          guidanceScale: options.guidance ?? 7.5,
          seed: options.seed,
        },
      });
      spinner.succeed('Batch generation complete');
      printResult(result, options.json);
    } catch (error) {
      spinner.fail('Batch generation failed');
      handleError(error);
    }
  });

program
  .command('usage')
  .description('Show current API usage and rate limits')
  .option('--json', 'Output raw JSON')
  .action(async (options) => {
    const client = createClient(program.opts());
    const spinner = ora('Fetching usage...').start();
    try {
      const result = await client.getUsage();
      spinner.succeed('Usage retrieved');
      printResult(result, options.json);
    } catch (error) {
      spinner.fail('Failed to fetch usage');
      handleError(error);
    }
  });

program
  .command('status')
  .description('Get the status of a generation job')
  .argument('<jobId>', 'Job ID')
  .option('--json', 'Output raw JSON')
  .action(async (jobId, options) => {
    const client = createClient(program.opts());
    const spinner = ora('Fetching job status...').start();
    try {
      const result = await client.getJobStatus(jobId);
      spinner.succeed('Job status retrieved');
      printResult(result, options.json);
    } catch (error) {
      spinner.fail('Failed to fetch job status');
      handleError(error);
    }
  });

program.parseAsync(process.argv).catch((error) => {
  handleError(error);
  process.exitCode = 1;
});

type CliOptions = {
  apiKey?: string;
  endpoint?: string;
};

function createClient(options: CliOptions) {
  const apiKey = options.apiKey ?? process.env.PIXELLABS_API_KEY;
  if (!apiKey) {
    console.error(chalk.red('Missing API key. Set --api-key or PIXELLABS_API_KEY.'));
    process.exit(1);
  }
  return new GenerationClient({
    apiKey,
    endpoint: options.endpoint,
  });
}

async function promptForText(message: string): Promise<string> {
  const { value } = await inquirer.prompt<{ value: string }>([
    {
      type: 'input',
      name: 'value',
      message,
      validate: (input) => (input ? true : 'This field is required'),
    },
  ]);
  return value;
}

async function promptForList(message: string): Promise<string[]> {
  const { value } = await inquirer.prompt<{ value: string }>([
    {
      type: 'input',
      name: 'value',
      message,
      validate: (input) => (input ? true : 'This field is required'),
    },
  ]);
  return value.split(',').map((item) => item.trim());
}

function parseModel(value: string): GenerationModel {
  switch (value) {
    case 'synthetix-v1':
      return GenerationModel.SYNTHETIX_V1;
    case 'synthetix-v2':
      return GenerationModel.SYNTHETIX_V2;
    case 'diffusion-xl':
      return GenerationModel.DIFFUSION_XL;
    default:
      throw new Error(`Unknown model: ${value}`);
  }
}

function parseAspectRatio(value: string): AspectRatio {
  switch (value) {
    case '1:1':
      return AspectRatio.SQUARE;
    case '3:4':
      return AspectRatio.PORTRAIT;
    case '4:3':
      return AspectRatio.LANDSCAPE;
    case '16:9':
      return AspectRatio.WIDE;
    case '21:9':
      return AspectRatio.ULTRA_WIDE;
    default:
      throw new Error(`Unknown aspect ratio: ${value}`);
  }
}

function parseQuality(value: string): QualityPreset {
  switch (value) {
    case 'draft':
      return QualityPreset.DRAFT;
    case 'standard':
      return QualityPreset.STANDARD;
    case 'high':
      return QualityPreset.HIGH;
    case 'ultra':
      return QualityPreset.ULTRA;
    default:
      throw new Error(`Unknown quality preset: ${value}`);
  }
}

function printResult(result: unknown, json?: boolean) {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(chalk.green('Result'));
  console.log(result);
}

function handleError(error: unknown) {
  if (error instanceof Error) {
    console.error(chalk.red(error.message));
    return;
  }
  console.error(chalk.red('Unknown error'));
}
