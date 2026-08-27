import { test, expect } from '@playwright/test';

// Example of Playwright's built-in visual regression assertion. Skipped by
// default: the homepage carousel/promo banners change over time, so a
// baseline taken today will legitimately drift and start "failing" for
// reasons that have nothing to do with a real bug. Un-skip this once you
// want to practice visual testing — the first run creates the baseline PNG
// next to this file (in homepage.visual.spec.ts-snapshots/); commit that
// baseline once you're happy with it, then future runs diff against it.
test.skip('homepage header renders consistently', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#header')).toHaveScreenshot('homepage-header.png');
});
