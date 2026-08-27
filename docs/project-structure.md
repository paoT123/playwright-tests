# Project Structure

What each folder/file in this repo is for, and what commonly lives there in a
Playwright project even if we don't have it yet.

```
.
├── .github/workflows/     CI pipeline definitions (GitHub Actions)
├── .auth/                 Saved login sessions (gitignored, created by global setup)
├── docs/                  Project documentation (this file, the test backlog)
├── tests/                 ONLY actual *.spec.ts files, split by layer/type
│   ├── ui/                Browser-driven tests (click, fill, navigate)
│   ├── api/               HTTP-only tests (no browser) via the `request` fixture
│   ├── mocks/             Tests that stub network calls with page.route()
│   └── visual/            Visual regression (screenshot) tests
├── pages/                 Page Object Model classes (support code, not tests)
├── fixtures/              Custom Playwright fixtures (setup/teardown)
├── utils/                 Plain helper functions (data generators, etc.)
├── test-data/             Static test data (JSON)
├── global-setup.example.ts / global-teardown.example.ts   Opt-in login-session pattern
├── playwright-report/     Generated HTML report (gitignored, recreated each run)
├── test-results/          Generated traces/screenshots per test run (gitignored)
├── playwright.config.ts   Global test config: baseURL, projects, reporters
├── tsconfig.json          TypeScript compiler settings + the @project/* alias
├── eslint.config.mjs      ESLint flat config (JS + TS + Playwright-specific rules)
├── .prettierrc.json / .prettierignore   Formatting rules
├── package.json / package-lock.json   Dependencies and npm scripts
└── .gitignore
```

## `tests/`

Where actual test files (`*.spec.ts`) live — nothing else. We split it into
subfolders by testing layer/type rather than by feature, so it's obvious at a
glance whether a test drives the browser, calls the API directly, mocks a network
call, or does visual regression:

- **`tests/ui/`** — tests that use the `page` fixture: navigate, click, fill forms,
  assert on visible elements. These launch a real (headless) browser.
- **`tests/api/`** — tests that use the `request` fixture: call REST endpoints
  directly and assert on status codes / JSON bodies. No browser involved, so these
  run much faster than UI tests.
- **`tests/mocks/add-to-cart.mock.spec.ts`** — uses `page.route()` to stub the real
  `GET /add_to_cart/{id}` call that `cart.js` fires on click (confirmed by reading
  the live `/static/js/cart.js`), then asserts the confirmation modal appears — a UI
  test that doesn't depend on the backend actually mutating cart state.
- **`tests/visual/homepage.visual.spec.ts`** — uses `expect(locator).toHaveScreenshot()`
  against the real `#header` element. Left `test.skip`'d on purpose: a public demo
  site's homepage content drifts over time, so a screenshot baseline would start
  "failing" for reasons unrelated to a real regression. Un-skip it when you want to
  practice visual testing specifically — first run creates the baseline PNG next to
  the spec file.

Separating by test *type* rather than layer — `tests/e2e/`, `tests/smoke/`,
`tests/regression/` — is another common convention, not used here, often combined
with `@tags` and `grep` in the Playwright config to let CI run just the smoke suite
on every PR and the full regression suite nightly.

## Support folders (`pages/`, `fixtures/`, `utils/`, `test-data/`)

These sit **outside** `tests/`, as siblings of it, rather than nested inside it.
That's a deliberate convention, not just a naming choice: `tests/` is scanned by
Playwright's test runner and should contain only things meant to run as tests;
everything below is infrastructure the specs *import*, so keeping it as a sibling
signals that distinction at a glance. (Nesting these under `tests/` instead — e.g.
`tests/pages/`, `tests/fixtures/` — is also a real pattern, common in smaller
projects/tutorials, and works identically since Playwright's `testMatch` only picks
up `*.spec.ts` files regardless of folder. It's a convention difference, not a
functional one.)

- **`pages/ProductsPage.ts`** — Page Object Model class wrapping the same search
  flow used directly in `tests/ui/product-search.spec.ts`: locators as class
  fields, actions as methods (`goto()`, `search(term)`, `resultNames()`). Consumed
  by `tests/ui/product-search-data-driven.spec.ts` so the spec itself reads like
  plain English instead of repeating raw locators.
- **`fixtures/account.fixtures.ts`** — a custom fixture, `registeredUser`, built on
  Playwright's fixture system (the same mechanism behind the built-in `page` and
  `request` fixtures we already use). It creates a throwaway account via
  `POST /api/createAccount` before the test body runs, hands the test the account
  data, then deletes it via `DELETE /api/deleteAccount` afterward — regardless of
  pass/fail. `tests/api/account-fixture-demo.spec.ts` shows a test consuming it: no
  manual create/delete calls in the test itself, just `registeredUser` as an
  argument. This is the pattern to reach for once several tests need the same
  logged-in state or the same seeded data instead of repeating setup/teardown code.

  Naming note: in Cypress, "fixtures" means static JSON test data. In Playwright,
  a "fixture" means injectable setup/teardown code like this file — different
  meaning, same word. `test-data/` below is Playwright's equivalent of what
  Cypress calls fixtures.
- **`utils/testData.ts`** — plain helper functions, not fixtures: `randomEmail()`
  and `randomUser()` generate throwaway signup data. The difference from a fixture
  is that these are just imported functions you call yourself; nothing is injected
  into the test automatically, and there's no teardown attached.
- **`test-data/`** — static JSON test data: `search-terms.json` (terms + expected
  minimum result count, looped over by the data-driven search spec) and
  `invalid-logins.json` (negative `verifyLogin` cases with their confirmed real
  response codes/messages), so the values aren't hardcoded inline in every spec.

## The `@project/*` import alias

Every cross-folder import in this repo (a spec pulling in a page object, a fixture
pulling in a utility, etc.) uses `@project/...` instead of a relative path like
`../../pages/ProductsPage`. For example:

```ts
import { ProductsPage } from '@project/pages/ProductsPage';
import searchTerms from '@project/test-data/search-terms.json';
```

`@project` always maps to the repo root, so whatever comes after it is just the
real path from the root — `@project/pages/...`, `@project/fixtures/...`,
`@project/utils/...`, `@project/test-data/...`. The prefix never changes no matter
which file is doing the importing or how deeply nested it is, which is the actual
problem this solves: without it, the same `pages/ProductsPage` import is
`../pages/ProductsPage` from one folder and `../../../pages/ProductsPage` from
another, purely as an accident of where the importing file happens to sit.

**How it's set up** — this is entirely a TypeScript feature, not a Playwright one.
`tsconfig.json` declares the mapping:

```json
"paths": {
  "@project/*": ["./*"]
}
```

Playwright's test runner reads and honors this `paths` mapping natively when it
compiles `.ts` files, so no extra bundler, loader, or `tsconfig-paths`-style
package is needed here — the same config that makes `npx tsc --noEmit` resolve the
alias also makes `npx playwright test` resolve it.

**Why one alias for the whole repo, rather than a separate alias per folder**
(e.g. `@pages/*`, `@fixtures/*`, `@utils/*`) — both are legitimate, but a single
root alias was chosen here because:
- It's one line in `tsconfig.json` instead of one line per top-level folder, so
  adding a new folder later (say, `constants/`) needs zero config changes — it's
  immediately importable as `@project/constants/...`.
- The path after the alias always matches the real folder structure, so jumping
  from an import statement to the file on disk is direct — there's no separate
  mental mapping to remember (`@pages` → the `pages/` folder, `@fixtures` → the
  `fixtures/` folder, etc.).
- It mirrors the most common version of this pattern in the wider ecosystem —
  Next.js/Vite project templates default to a single `@/*` alias over the whole
  `src/`, not one per subfolder, for the same reasons.

Per-folder aliases can still make sense in much larger codebases where you want an
import itself to signal "this is a page object" vs. "this is a utility" without
reading the rest of the path — but for a project this size, a single alias is
simpler to maintain and just as effective at eliminating relative-path chains.

## `.auth/` and global setup/teardown

- **`.auth/`** + **`global-setup.example.ts`** / **`global-teardown.example.ts`** —
  the standard pattern for login-heavy suites: a one-time global setup registers an
  account via the API, logs in through the real UI once, and saves the resulting
  `storageState` (cookies/localStorage) to `.auth/user.json`; global teardown deletes
  the account once the whole run finishes. Kept as `.example.ts` (not wired into
  `playwright.config.ts`) since running it on every `npx playwright test` would
  create/delete a real account on every run — see the comments at the top of
  `global-setup.example.ts` for the exact rename + config change to enable it.
  `.auth/` is gitignored, since it would otherwise hold live session data.

## `docs/`

Project documentation that isn't code: this file and `test-case-backlog.md` (the
list of not-yet-automated test cases). Nothing here is executed by Playwright.

## `.github/workflows/`

GitHub Actions CI definitions. `tests.yml` runs `npx playwright test` on every push
to `main` and every pull request, on GitHub's own runners — see the note already
given about what that file does. Only relevant once this repo is pushed to GitHub.

## `playwright-report/` and `test-results/`

Both are generated output, not source — regenerated every time you run
`npx playwright test` and safe to delete. Both are gitignored.

- **`playwright-report/`** — the HTML report (`index.html`) you'd open with
  `npx playwright show-report` to see a visual pass/fail summary.
- **`test-results/`** — per-test artifacts: traces (`trace: 'on-first-retry'` in the
  config), screenshots on failure, and a `.last-run.json` used by `--last-failed`.

## Config files

- **`playwright.config.ts`** — the one place that defines `baseURL`
  (`https://automationexercise.com`), which browser projects to run (`chromium`),
  retry behavior, and reporters. Both UI and API tests share this config, which is
  why one `baseURL` covers both `page.goto('/products')` and
  `request.get('/api/productsList')`.
- **`tsconfig.json`** — standard TypeScript compiler options; lets editors and
  Playwright type-check the `.spec.ts` files.
- **`package.json` / `package-lock.json`** — declares `@playwright/test` and
  `typescript` as dev dependencies; the lockfile pins exact versions so CI installs
  the same thing you tested locally (`npm ci` in the workflow relies on this).

## Linting and formatting: `eslint.config.mjs`, `.prettierrc.json`

Two separate tools, doing two separate jobs:

- **ESLint** (`eslint.config.mjs`) — checks for actual problems in the code, not
  style. Uses the flat-config format (ESLint 9+), composed from three rule sets:
  `@eslint/js`'s recommended rules (general JS correctness), `typescript-eslint`'s
  recommended rules (type-aware TS checks), and `eslint-plugin-playwright`'s
  recommended rules scoped to `tests/**`, `fixtures/**`, and `*.example.ts` — this
  last one is what actually matters for a Playwright project: it flags
  Playwright-specific anti-patterns like a stray `waitForTimeout`, an assertion
  missing its `await`, or a `.only`/`.skip` left in a spec. It already caught a
  real (intentional) one: `playwright/no-skipped-test` fires on
  `tests/visual/homepage.visual.spec.ts`'s `test.skip`, correctly, since that skip
  is deliberate (see the comment in that file) — the warning doesn't need fixing,
  it's ESLint doing its job.
- **Prettier** (`.prettierrc.json` / `.prettierignore`) — formatting only
  (quotes, semicolons, line width), no opinion on correctness. `eslint-config-prettier`
  is included in `eslint.config.mjs` specifically to turn off the handful of ESLint
  stylistic rules that would otherwise fight with Prettier over the same thing.

Run them via the npm scripts: `npm run lint`, `npm run format` (auto-fixes),
`npm run format:check` (CI-safe, fails instead of writing). Neither is wired into
`tests.yml` yet — add a `run: npm run lint` / `run: npm run format:check` step
there if you want CI to enforce them, the same way `npx playwright test` already
is.

## CI config: GitHub Actions vs. Azure Pipelines

Both are "run tests automatically" systems, but they expect the pipeline file in a
different place with a different shape. Only set up whichever one matches where the
repo is actually hosted/built — you don't need both.

### GitHub Actions (what this project uses)

- **Folder:** `.github/workflows/` at the repo root — the name is fixed, GitHub only
  looks there.
- **File:** any `*.yml`/`*.yaml` file in that folder is picked up automatically (we
  used `tests.yml`). You can have several — each is a separate pipeline.
- **Structure:** `on:` (triggers, e.g. `push`/`pull_request`) → `jobs:` → each job has
  `runs-on:` (the VM image) and a `steps:` list, where each step is either a reusable
  `uses: action@version` or a raw `run:` shell command. See `.github/workflows/tests.yml`
  in this repo for the concrete example.
- Runs on GitHub-hosted runners by default; results show up under the repo's
  **Actions** tab.
- The `setup-node` step already uses `cache: 'npm'`, caching npm's dependency cache
  keyed on `package-lock.json` to speed up `npm ci` — this is a standard, unopinionated
  win with no real downside.

**Optional: caching the Playwright browser binaries too.** Not currently in
`tests.yml`, and deliberately left out — unlike the npm cache above, this one is a
genuinely debated practice rather than a clear standard. Playwright's own CI
guidance is lukewarm on it: the browser download is usually fast enough over
Microsoft's CDN that the time saved is modest, and a stale cache can end up serving
a browser binary that no longer matches the installed `@playwright/test` version
after a version bump — a version-skew bug that's annoying to debug. If you want it
anyway, add this step **between the `npm ci` step and the `npx playwright install
--with-deps` step**:

```yaml
      - name: Cache Playwright browsers
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: playwright-browsers-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
```

Keying it on `package-lock.json`'s hash means a Playwright version bump changes the
key and busts the cache automatically, which mostly neutralizes the version-skew
risk — but `npx playwright install --with-deps` still needs to run unconditionally
every time regardless (it also apt-installs OS-level system libraries on the fresh
runner, which this cache doesn't cover); Playwright's CLI just detects the browser
is already present at the expected version and skips re-downloading it.

### Azure Pipelines

- **Folder:** no fixed folder name — convention is to put the file at the **repo
  root** (or in a folder like `pipelines/` or `.azure/`), since you choose the path
  yourself when you set up the pipeline in Azure DevOps.
- **File:** typically `azure-pipelines.yml` at the root by default, though Azure DevOps
  lets you name/path it however you like when you create the pipeline.
- **Structure:** `trigger:` (branches that start a run) → `pool:` (the VM image,
  e.g. `vmImage: 'ubuntu-latest'`) → `steps:` — a flat list of tasks, where each step
  is either a built-in `task: SomeTask@1` or a raw script (`script: npx playwright test`).
  There's no separate `jobs:`/`on:` split by default (though `jobs:` and `stages:` exist
  for more complex multi-job pipelines).
- A rough equivalent of our `tests.yml`:

  ```yaml
  trigger:
    branches:
      include: [main]
  pr:
    branches:
      include: [main]

  pool:
    vmImage: 'ubuntu-latest'

  steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '20.x'
    - script: npm ci
      displayName: 'Install dependencies'
    - script: npx playwright install --with-deps
      displayName: 'Install Playwright browsers'
    - script: npx playwright test
      displayName: 'Run tests'
    - task: PublishPipelineArtifact@1
      condition: always()
      inputs:
        targetPath: 'playwright-report'
        artifact: 'playwright-report'
  ```

- Runs on Microsoft-hosted (or self-hosted) agents; results show up in Azure DevOps
  under **Pipelines**, not on GitHub at all — this only applies if the repo is
  mirrored into or hosted on Azure DevOps.
