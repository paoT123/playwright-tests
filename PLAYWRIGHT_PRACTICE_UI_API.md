# Playwright Practice Project — UI + API Testing

## How to use this file

Paste this entire document into a fresh Claude Code (VS Code extension) chat, inside an
empty project folder. Tell Claude Code to follow it end-to-end. It's short and low-cost
on purpose — this is a quick practice scaffold, not a big multi-agent build.

**Instruction to Claude Code — no git or GitHub commands:** never run `git init`,
`git add`, `git commit`, `git remote`, `git push`, `gh repo create`, or any other
command that touches git history or GitHub, including read-only ones like `git log`,
`git status` against a remote, or `gh repo view`. Whenever one of these would help, stop
and tell me the exact command to run myself, and wait for me to confirm I've run it.

**Instruction to Claude Code — verify against the live site, don't guess:** before
writing either test below, actually load the relevant page and actually call the
relevant API endpoint yourself (e.g. with `curl`, or by navigating with Playwright's
codegen/inspector) to see the real selectors and the real response shape. Don't assume
element IDs or JSON fields from this document — confirm them against the live site
first, since it can change.

When you're done, post a short summary: what you created (file paths), the command I
can run to verify it (`npx playwright test`), and confirm both tests pass before you
consider this finished.

---

## 0. What we're building

A small Playwright + TypeScript project against **AutomationExercise**
(`https://automationexercise.com`) — a free public practice site built specifically for
QA automation, with no real accounts or payments involved. It's a good fit for this
practice project because it's one of the few sites that gives you **both** a real UI to
click through *and* a documented public REST API on the same domain
(`https://automationexercise.com/api_list`), so one `playwright.config.ts` and one
`baseURL` cover both kinds of testing.

You'll end up with one UI test and one API test, and — worth noticing once they're
built — they exercise the *same underlying feature* two different ways: searching for a
product. One drives it through the search box like a user would; the other calls the
search endpoint directly. That pairing is the actual skill this practice project is
meant to build: recognizing when a UI flow has an API equivalent, and knowing when to
test which layer.

---

## Prerequisites

- Node.js (LTS, v18+) and npm on PATH.
- VS Code with the Claude Code extension installed and signed in.
- Git installed (only used by you, manually — see the instruction above).
- An empty project folder open in VS Code as the workspace root.
- Internet access (`npx playwright install` downloads browser binaries).

---

## 1. Scaffold the project

```bash
npm init -y
npm install -D @playwright/test typescript
npx playwright install --with-deps chromium
npx tsc --init
```

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'https://automationexercise.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

Create `.gitignore`:

```
node_modules/
test-results/
playwright-report/
blob-report/
.env
.claude/settings.local.json
```

Create the folder structure: `tests/ui/` and `tests/api/` — keep the two kinds of test
physically separate so it's obvious at a glance which layer each one is testing.

---

## 2. UI test example — search for a product

Write `tests/ui/product-search.spec.ts`.

Flow: go to the homepage, use the visible product search (Products page has a search
box), search for a term (e.g. "Dress" or "Top" — pick something that reliably returns
results, confirm it does by looking at the live site first), and assert that a
"Searched Products" heading appears along with at least one product result.

Use Playwright's recommended locators (`getByRole`, `getByPlaceholder`, `getByText`)
over raw CSS/XPath selectors where the page's markup allows it, and avoid a fixed
`waitForTimeout` — wait on the actual result element becoming visible instead.

You can write this as one flat spec file for now. If you want the practice, this is
also a natural place to extract a small Page Object (`tests/pages/ProductsPage.ts`)
with a `search(term)` method — optional, not required for this exercise.

---

## 3. API test example — search for a product via the API

Write `tests/api/search-products.spec.ts` using Playwright's built-in `request`
fixture (no extra HTTP library needed).

Call `POST /api/searchProduct` with a `search_product` form field matching the same
term you used in the UI test, and assert on the real response you observed when you
checked the live endpoint — at minimum, that the call succeeds and the response body
contains a list of products. Note: some practice APIs like this one encode the "real"
result inside the JSON body (e.g. a `responseCode` field) even when the HTTP transport
status is 200 — check what this one actually does before asserting on `response.status()`
alone.

Also worth a quick second assertion in the same file (or a second `test(...)` block):
call `GET /api/productsList` with no parameters and confirm it returns the full product
list — this is the simplest possible read-only check and a good sanity baseline if the
search test ever starts failing for an unrelated reason.

---

## 4. Verify

Run:

```bash
npx playwright test
```

Both tests should pass. If the UI test is flaky on first run, that's usually a locator
or timing issue — fix the wait condition rather than adding a fixed sleep.

---

## 5. Test case backlog — 5 UI + 5 API cases to automate next

Once the two example tests are green, don't build more tests yet — instead write out a
backlog for me so I can pick what to practice next myself. Save it as
`docs/test-case-backlog.md` with two lists of 5 test cases each, in this shape: a short
title, which page/endpoint it uses, and one sentence on what it actually verifies.

Base the list on this confirmed feature inventory — don't invent flows beyond what's
here; if you want to go past it, spot-check against the live site first, same rule as
in Section 2/3:

**Confirmed UI flows on automationexercise.com:** account signup, login (valid and
invalid credentials), product browsing with category and brand filters, product detail
pages, add-to-cart and cart viewing, and the Contact Us form.

**Confirmed API endpoints** (base `https://automationexercise.com/api`):
- `GET /productsList` — all products
- `GET /brandsList` — all brands
- `POST /searchProduct` (`search_product` param) — search; errors without the param
- `POST /verifyLogin` (`email`, `password`) — validates credentials; returns a 404-style
  response for a non-existent user
- `POST /createAccount` — register a new user (many required fields — check the live
  form/API docs for the full list)
- `PUT /updateAccount` — modify an existing user
- `DELETE /deleteAccount` — remove a user
- `GET /getUserDetailByEmail` (`email`) — look up a user's profile

For the UI five, cover: signup, login (valid + invalid credentials can be one case),
cart (add a product, verify it appears correctly on the cart page), browse/filter
(category or brand), and the contact form.

For the API five, cover: one simple read check each for `productsList` and
`brandsList`, one negative case (missing a required parameter, or an unsupported HTTP
method against one of these endpoints), one `verifyLogin` case (valid vs. invalid
credentials), and one multi-step case chaining `createAccount` → `getUserDetailByEmail`
→ `deleteAccount` to confirm the account actually round-trips.

Don't write the test code for these yet — just the backlog list, so I can choose which
ones to build myself as practice.

---

## 6. CI: run tests automatically on GitHub

Add `.github/workflows/tests.yml` — ordinary CI, no Claude involved:

```yaml
name: Playwright Tests
on:
  push:
    branches: [main]
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: playwright-report, path: playwright-report/ }
```

`cache: 'npm'` on `setup-node` caches npm's own cache (keyed on `package-lock.json`),
speeding up `npm ci` — this part is an unambiguous, universally-used standard.

**Optional: also caching the Playwright browser binaries.** Not added above on
purpose — it's a genuinely debated practice, not a clear standard. Playwright's own
CI docs are lukewarm on it: the browser download is usually fast enough over
Microsoft's CDN that the saved time is modest, and a stale cache can serve a browser
binary that no longer matches the `@playwright/test` version after a bump, which is
an annoying class of bug to debug. If you still want it, insert this step between
`npm ci` and `npx playwright install --with-deps`:

```yaml
      - name: Cache Playwright browsers
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: playwright-browsers-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
```

Keying it on `package-lock.json`'s hash means a Playwright version bump changes the
key and busts the cache automatically, which mostly neutralizes the version-skew
risk above — but it's still one more moving part for a download that often isn't
the actual bottleneck.

This runs the same `npx playwright test` command you just verified locally, on every
push and pull request to `main`, and uploads the HTML report as a downloadable artifact
whether the run passes or fails — so if something breaks in CI, you can see why without
rerunning it locally. It only actually starts running once you push it to GitHub
yourself (per the no-git-commands rule above) — Claude Code just needs to create the
file correctly; it can't verify the workflow goes green on GitHub itself.

Once the backlog file is saved, `tests.yml` exists, and both example tests are green
locally, continue to Section 7 — the sections below extend the base scaffold with
support-code folders, a couple more example test types, an import alias, and basic
lint/format tooling. They're written so an agent following this document top-to-bottom
in a fresh, empty project folder ends up with the exact same layout this project
converged on.

---

## 7. Support folders: `pages/`, `fixtures/`, `utils/`, `test-data/`

Create these as **siblings of `tests/`**, not nested inside it:

```bash
mkdir -p pages fixtures utils test-data
```

This is a deliberate convention, not just a naming choice: `tests/` is scanned by
Playwright's test runner and should contain only things meant to run as tests;
`pages/`, `fixtures/`, `utils/`, and `test-data/` are infrastructure the specs
*import*, so keeping them as siblings signals that distinction at a glance.
(Nesting them under `tests/` instead is also a real pattern, more common in
smaller projects/tutorials — it works identically since Playwright's `testMatch`
only picks up `*.spec.ts` files regardless of folder. Pick whichever, but be
consistent.)

**`pages/ProductsPage.ts`** — Page Object Model class wrapping the search flow
from Section 2:

```ts
import { Page, Locator, expect } from '@playwright/test';

export class ProductsPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly searchedProductsHeading: Locator;
  readonly results: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder('Search Product');
    this.searchButton = page.locator('#submit_search');
    this.searchedProductsHeading = page.getByRole('heading', { name: 'Searched Products' });
    this.results = page.locator('.product-image-wrapper .productinfo');
  }

  async goto() {
    await this.page.goto('/products');
    await expect(this.page.getByRole('heading', { name: 'All Products' })).toBeVisible();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.searchButton.click();
    await expect(this.searchedProductsHeading).toBeVisible();
  }

  async resultNames(): Promise<string[]> {
    return this.results.allTextContents();
  }
}
```

**`utils/testData.ts`** — plain helper functions (not fixtures — just imported
and called, no teardown attached):

```ts
export function randomEmail(prefix = 'pw.practice'): string {
  const unique = `${Date.now()}.${Math.floor(Math.random() * 100000)}`;
  return `${prefix}.${unique}@example.com`;
}

export interface NewAccount {
  [key: string]: string;
  name: string;
  email: string;
  password: string;
  title: 'Mr' | 'Mrs';
  birth_date: string;
  birth_month: string;
  birth_year: string;
  firstname: string;
  lastname: string;
  company: string;
  address1: string;
  address2: string;
  country: string;
  zipcode: string;
  state: string;
  city: string;
  mobile_number: string;
}

// Full field list required by POST /api/createAccount — confirm against
// https://automationexercise.com/api_list (API 11) before relying on it, since
// required fields can change.
export function randomUser(overrides: Partial<NewAccount> = {}): NewAccount {
  return {
    name: 'Practice User',
    email: randomEmail(),
    password: 'Test1234!',
    title: 'Mr',
    birth_date: '10',
    birth_month: '5',
    birth_year: '1990',
    firstname: 'Practice',
    lastname: 'User',
    company: 'ACME',
    address1: '123 Test St',
    address2: '',
    country: 'United States',
    zipcode: '12345',
    state: 'CA',
    city: 'Testville',
    mobile_number: '1234567890',
    ...overrides,
  };
}
```

**`fixtures/account.fixtures.ts`** — a custom Playwright fixture, `registeredUser`:
creates a throwaway account via the API before the test runs, hands the test the
account data, then deletes it afterward regardless of pass/fail:

```ts
import { test as base, expect, APIRequestContext } from '@playwright/test';
import { randomUser, NewAccount } from '@project/utils/testData';

type AccountFixtures = {
  registeredUser: NewAccount;
};

export const test = base.extend<AccountFixtures>({
  registeredUser: async ({ request }, use) => {
    const user = randomUser();

    const createResponse = await request.post('/api/createAccount', { form: user });
    const createBody = await createResponse.json();
    expect(createBody.responseCode).toBe(201);

    await use(user);

    await deleteAccount(request, user);
  },
});

async function deleteAccount(request: APIRequestContext, user: NewAccount) {
  const deleteResponse = await request.delete('/api/deleteAccount', {
    form: { email: user.email, password: user.password },
  });
  const deleteBody = await deleteResponse.json();
  expect(deleteBody.responseCode).toBe(200);
}

export { expect };
```

**`test-data/search-terms.json`** and **`test-data/invalid-logins.json`** — static
JSON data so values aren't hardcoded inline in specs. Verify each term/response
against the live site first (same rule as Sections 2/3):

```json
[
  { "term": "Dress", "expectMinResults": 1 },
  { "term": "Top", "expectMinResults": 1 },
  { "term": "Jeans", "expectMinResults": 1 },
  { "term": "Shirt", "expectMinResults": 1 }
]
```

```json
[
  {
    "case": "non-existent account",
    "email": "definitely.not.a.real.user@example.com",
    "password": "whatever123",
    "expectedResponseCode": 404,
    "expectedMessage": "User not found!"
  },
  {
    "case": "missing password field entirely",
    "email": "someone@example.com",
    "password": null,
    "expectedResponseCode": 400,
    "expectedMessage": "Bad request, email or password parameter is missing in POST request."
  }
]
```

Then two example specs consuming this scaffolding — `tests/ui/product-search-data-driven.spec.ts`
(page object + JSON data, one test per search term) and `tests/api/account-fixture-demo.spec.ts`
(consuming the `registeredUser` fixture, no manual create/delete calls in the test body):

```ts
// tests/ui/product-search-data-driven.spec.ts
import { test, expect } from '@playwright/test';
import { ProductsPage } from '@project/pages/ProductsPage';
import searchTerms from '@project/test-data/search-terms.json';

for (const { term, expectMinResults } of searchTerms) {
  test(`searching for "${term}" returns at least ${expectMinResults} result(s)`, async ({
    page,
  }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.goto();
    await productsPage.search(term);

    const names = await productsPage.resultNames();
    expect(names.length).toBeGreaterThanOrEqual(expectMinResults);
  });
}
```

```ts
// tests/api/account-fixture-demo.spec.ts
import { test, expect } from '@project/fixtures/account.fixtures';

test('a freshly registered account can be looked up by email', async ({
  request,
  registeredUser,
}) => {
  const response = await request.get('/api/getUserDetailByEmail', {
    params: { email: registeredUser.email },
  });
  const body = await response.json();

  expect(body.responseCode).toBe(200);
  expect(body.user.email).toBe(registeredUser.email);
  expect(body.user.name).toBe(registeredUser.name);
});
```

---

## 8. Two more test-type folders: `tests/mocks/`, `tests/visual/`

**`tests/mocks/add-to-cart.mock.spec.ts`** — demonstrates `page.route()` to stub a
network call instead of hitting the real backend. Before writing this, confirm what
network call the UI action actually fires (don't guess) — e.g. by reading the
site's own client-side JS. On automationexercise.com, `/static/js/cart.js` shows
that clicking `.add-to-cart` fires `GET /add_to_cart/{id}` and reveals `#cartModal`
on success:

```ts
import { test, expect } from '@playwright/test';

test('add-to-cart shows the confirmation modal (network call mocked)', async ({ page }) => {
  await page.route('**/add_to_cart/*', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<div>1</div>' })
  );

  await page.goto('/products');
  await page.locator('.add-to-cart').first().click();

  await expect(page.locator('#cartModal')).toBeVisible();
  await expect(page.getByText('Added!')).toBeVisible();
});
```

**`tests/visual/homepage.visual.spec.ts`** — `expect(locator).toHaveScreenshot()`
against a real, stable element. Left `test.skip`'d on purpose: a public demo site's
content drifts over time, so a screenshot baseline would start "failing" for
reasons unrelated to a real regression. Only un-skip this when you actually want to
practice visual testing — the first run creates the baseline PNG next to the spec:

```ts
import { test, expect } from '@playwright/test';

test.skip('homepage header renders consistently', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#header')).toHaveScreenshot('homepage-header.png');
});
```

---

## 9. Optional, not wired in: `.auth/` + global setup/teardown

The standard pattern for login-heavy suites: a one-time global setup registers an
account via the API, logs in through the real UI once, and saves the resulting
`storageState` (cookies/localStorage) to `.auth/user.json`, so individual tests can
start already logged in instead of repeating the login flow. Create these as
`global-setup.example.ts` / `global-teardown.example.ts` at the repo root —
**`.example.ts`, not wired into `playwright.config.ts`** — since running this on
every `npx playwright test` would create/delete a real account on every run:

```ts
// global-setup.example.ts
import { chromium, request as apiRequest, FullConfig } from '@playwright/test';
import { randomUser } from '@project/utils/testData';
import fs from 'fs';
import path from 'path';

// To enable: rename this file to global-setup.ts (and the teardown counterpart
// to global-teardown.ts), then in playwright.config.ts add:
//   globalSetup: require.resolve('./global-setup'),
//   globalTeardown: require.resolve('./global-teardown'),
// and give a project `use: { storageState: '.auth/user.json' }` to consume it.
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]!.use.baseURL as string;
  const user = randomUser();

  const context = await apiRequest.newContext({ baseURL });
  await context.post('/api/createAccount', { form: user });
  await context.dispose();

  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });
  await page.goto('/login');
  await page.getByPlaceholder('Email Address').first().fill(user.email);
  await page.locator('[data-qa="login-password"]').fill(user.password);
  await page.locator('[data-qa="login-button"]').click();

  fs.mkdirSync(path.join(__dirname, '.auth'), { recursive: true });
  await page.context().storageState({ path: path.join(__dirname, '.auth', 'user.json') });
  await browser.close();

  fs.writeFileSync(
    path.join(__dirname, '.auth', 'user.json.credentials'),
    JSON.stringify({ email: user.email, password: user.password })
  );
}
```

```ts
// global-teardown.example.ts
import { request as apiRequest, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export default async function globalTeardown(config: FullConfig) {
  const credentialsPath = path.join(__dirname, '.auth', 'user.json.credentials');
  if (!fs.existsSync(credentialsPath)) return;

  const { email, password } = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
  const baseURL = config.projects[0]!.use.baseURL as string;

  const context = await apiRequest.newContext({ baseURL });
  await context.delete('/api/deleteAccount', { form: { email, password } });
  await context.dispose();

  fs.rmSync(credentialsPath);
}
```

Add `.auth/` to `.gitignore` — it would otherwise hold live session data.

---

## 10. The `@project/*` import alias

Instead of relative imports that get longer the deeper a file sits
(`../../pages/ProductsPage`), map a single alias to the repo root in
`tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@project/*": ["./*"]
    }
  }
}
```

(Note: this requires **no `baseUrl` key** — recent TypeScript releases removed
`baseUrl` entirely and require `paths` values to be written as explicit relative
paths like `"./*"` instead.)

Playwright's test runner reads and honors this `paths` mapping natively when it
compiles `.ts` files — no bundler, loader, or `tsconfig-paths`-style package
needed. Then every cross-folder import becomes `@project/<real path from root>`,
e.g. `import { ProductsPage } from '@project/pages/ProductsPage'`. A single
root-level alias (rather than one alias per folder, e.g. `@pages/*`) was chosen
because it needs zero config changes when a new top-level folder is added later,
and it mirrors the most common version of this pattern elsewhere (Next.js/Vite
templates default to one `@/*` alias over the whole `src/`, not one per subfolder).

---

## 11. Basic tooling: npm scripts, ESLint, Prettier

Add real scripts to `package.json` (replacing the default placeholder `"test"`
script from `npm init`):

```json
"scripts": {
  "test": "playwright test",
  "test:ui": "playwright test tests/ui",
  "test:api": "playwright test tests/api",
  "report": "playwright show-report",
  "typecheck": "tsc --noEmit",
  "lint": "eslint .",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

Install and configure ESLint (flat config) + Prettier:

```bash
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-playwright eslint-config-prettier prettier
```

**Compatibility check before installing:** `typescript-eslint` pins a `typescript`
peer range (check its currently published range — it has historically lagged
behind the newest TypeScript major version by months). If `npm install` reports an
`ERESOLVE` peer conflict against the `typescript` version already in this project,
downgrade `typescript` to the newest version inside that supported range rather
than force-installing with `--legacy-peer-deps` — a type-aware linter parsing a
TypeScript version it wasn't built for is a real (not theoretical) source of
broken or nonsensical lint results.

`eslint.config.mjs`:

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['tests/**/*.ts', 'fixtures/**/*.ts', '*.example.ts'],
    ...playwright.configs['flat/recommended'],
  },
  prettierConfig,
  {
    ignores: ['node_modules/', 'playwright-report/', 'test-results/', '.auth/'],
  }
);
```

`.prettierrc.json`:

```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "es5"
}
```

`.prettierignore`:

```
node_modules/
playwright-report/
test-results/
.auth/
```

`eslint-plugin-playwright`'s recommended rules are the part that matters most for
this kind of project — they catch Playwright-specific issues (a stray
`waitForTimeout`, a missing `await` on an assertion, an accidental `.only`) that
generic JS/TS linting wouldn't. Run `npm run lint` and `npm run format:check` to
verify both are wired up correctly.

---

Once sections 7–11 are done and `npm run typecheck` / `npm run lint` both run clean
(warnings from `eslint-plugin-playwright` on intentional `test.skip`s are expected,
not something to fix), give me the summary described at the top of this document,
now covering the full scaffold rather than just the two example tests.
