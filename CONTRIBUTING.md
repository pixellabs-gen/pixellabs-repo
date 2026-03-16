# Contributing to PixelLabs

Thank you for considering contributing to PixelLabs. This document describes the development workflow, quality standards, and pull request requirements.

## Code of Conduct

All contributors are expected to maintain a professional and respectful environment.

## Development Workflow

1. Fork and clone the repository.
2. Create a feature branch from `main`.
3. Implement changes with tests and documentation updates.
4. Ensure all checks pass locally.
5. Open a pull request with a clear description and test evidence.

## Branch Naming

- `feature/<short-description>`
- `fix/<short-description>`
- `docs/<short-description>`
- `refactor/<short-description>`
- `chore/<short-description>`

## Commit Guidelines

Use conventional commits:

```
<type>(<scope>): <subject>
```

Examples:

```
feat(core): add prompt normalization
fix(cli): handle missing api key
```

## Local Development

```
npm install
npm run lint
npm run test
npm run build
```

## Rust Engine Checks

```
cd packages/inference-engine
cargo test
```

## Pull Request Checklist

- Tests added or updated
- Documentation updated (if applicable)
- Lint and tests passing
- Clear summary and rationale
