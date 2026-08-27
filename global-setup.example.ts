import { chromium, request as apiRequest, FullConfig } from '@playwright/test';
import { randomUser } from '@project/utils/testData';
import fs from 'fs';
import path from 'path';

// Example of Playwright's globalSetup pattern for saving a logged-in
// session so individual tests don't each have to repeat the login flow.
// NOT wired into playwright.config.ts — rename to global-setup.ts, add its
// counterpart global-teardown.example.ts -> global-teardown.ts, then in
// playwright.config.ts add:
//   globalSetup: require.resolve('./global-setup'),
//   globalTeardown: require.resolve('./global-teardown'),
// and give a project `use: { storageState: '.auth/user.json' }` to consume it.
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]!.use.baseURL as string;
  const user = randomUser();

  // Register the account via the API first — faster and more reliable than
  // filling the signup form for setup that isn't itself under test.
  const context = await apiRequest.newContext({ baseURL });
  await context.post('/api/createAccount', { form: user });
  await context.dispose();

  // Log in through the real UI once, then persist the resulting session.
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });
  await page.goto('/login');
  await page.getByPlaceholder('Email Address').first().fill(user.email);
  await page.locator('[data-qa="login-password"]').fill(user.password);
  await page.locator('[data-qa="login-button"]').click();

  fs.mkdirSync(path.join(__dirname, '.auth'), { recursive: true });
  await page.context().storageState({ path: path.join(__dirname, '.auth', 'user.json') });
  await browser.close();

  // Stash credentials so global-teardown.example.ts can delete the account.
  fs.writeFileSync(
    path.join(__dirname, '.auth', 'user.json.credentials'),
    JSON.stringify({ email: user.email, password: user.password })
  );
}
