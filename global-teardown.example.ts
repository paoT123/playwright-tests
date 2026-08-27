import { request as apiRequest, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Counterpart to global-setup.example.ts: deletes the throwaway account
// created for the login session once the whole test run finishes, so
// practice runs don't accumulate accounts on the live site.
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
