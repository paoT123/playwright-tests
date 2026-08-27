# Getting Started (fresh clone)

How to get this project running on a new machine after cloning it.

## Prerequisites

- Node.js LTS (v18+) and npm on PATH.
- Internet access (`playwright install` downloads browser binaries; tests hit the
  live site at `https://automationexercise.com`).

## Setup

```bash
git clone <this-repo-url>
cd playwright-tests
npm install
npx playwright install --with-deps chromium
```

- `npm install` reads `package-lock.json` and installs the exact same dependency
  versions used to build/verify this project (`@playwright/test`, `typescript`,
  `@types/node`) — no separate step needed beyond this.
- `npx playwright install --with-deps chromium` downloads the actual Chromium
  browser binary Playwright drives. This is separate from `npm install` because
  it's not an npm package — skip `--with-deps` if you're not on Linux/CI and
  already have the OS-level browser dependencies (macOS/Windows don't need it).

## Running the tests

```bash
npx playwright test
```

Runs every `*.spec.ts` file under `tests/` headless, against the live site — no
local server to start first. Expect **9 passed, 1 skipped** (the visual test in
`tests/visual/` is intentionally skipped by default; see
`docs/project-structure.md`).

Other useful commands:

```bash
npx playwright test --headed        # watch the browser while tests run
npx playwright test tests/ui        # run only one folder
npx playwright show-report          # open the last HTML report
npx tsc --noEmit                    # type-check the whole project without running tests
```

## What you don't need to set up

- **No `.env` file** — nothing in this project reads environment variables; the
  target site's base URL is hardcoded in `playwright.config.ts`.
- **No local backend/database** — every test runs against the public
  `automationexercise.com` site directly.
- **No account credentials to configure** — tests that need an account
  (`fixtures/account.fixtures.ts`) create and delete a throwaway one via the API
  automatically, per test run.

## Optional: CI

`.github/workflows/tests.yml` runs the same `npx playwright test` command on
GitHub Actions for every push/PR to `main` — it only starts working once this repo
is pushed to GitHub; no local setup needed for it.

## If something fails on first run

- **Browser not found** — re-run `npx playwright install --with-deps chromium`.
- **A test fails that wasn't failing before** — the target is a live public site,
  so content (search results, product IDs, promo banners) can genuinely change
  over time; check the failure screenshot/trace in `playwright-report/` before
  assuming the test itself is broken.
