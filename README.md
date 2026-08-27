# playwright-tests

A Playwright + TypeScript practice project testing both the UI and the public REST
API of [AutomationExercise](https://automationexercise.com) — a free QA practice
site with a real UI to click through and a documented API on the same domain.

## Quick start

```bash
npm install
npx playwright install --with-deps chromium
npm test
```

Full setup instructions (prerequisites, what each command does, troubleshooting):
see [`docs/getting-started.md`](docs/getting-started.md).

## Common commands

```bash
npm test              # run the full suite
npm run test:ui        # UI tests only
npm run test:api       # API tests only
npm run report          # open the last HTML report
npm run typecheck       # tsc --noEmit
npm run lint            # ESLint
npm run format:check    # Prettier, check-only
```

## Project layout

`tests/` holds only actual spec files, split by layer (`ui/`, `api/`, `mocks/`,
`visual/`). Support code — page objects, fixtures, helpers, static test data —
lives in sibling folders (`pages/`, `fixtures/`, `utils/`, `test-data/`) and is
imported via a single `@project/*` path alias instead of relative paths.

Full breakdown of every folder and file: [`docs/project-structure.md`](docs/project-structure.md).

## Other docs

- [`docs/test-case-backlog.md`](docs/test-case-backlog.md) — candidate test cases
  not yet automated, for picking up as practice.
- [`PLAYWRIGHT_PRACTICE_UI_API.md`](PLAYWRIGHT_PRACTICE_UI_API.md) — the original
  step-by-step build instructions this project was scaffolded from.

## CI

`.github/workflows/tests.yml` runs `npm test` on GitHub Actions on every push and
pull request to `main`, and uploads the HTML report as an artifact.
