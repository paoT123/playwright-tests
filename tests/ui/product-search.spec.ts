import { test, expect } from '@playwright/test';

test('search for a product on the Products page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Products' }).click();
  await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();

  await page.getByPlaceholder('Search Product').fill('Dress');
  await page.locator('#submit_search').click();

  await expect(page.getByRole('heading', { name: 'Searched Products' })).toBeVisible();

  const results = page.locator('.product-image-wrapper .productinfo');
  await expect(results.first()).toBeVisible();
  expect(await results.count()).toBeGreaterThan(0);

  await expect(results.first().getByText('Dress', { exact: false })).toBeVisible();
});
