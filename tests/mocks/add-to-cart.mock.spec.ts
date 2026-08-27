import { test, expect } from '@playwright/test';

// Demonstrates page.route() to stub a network call instead of hitting the
// real backend. Confirmed via tests/static/js/cart.js that clicking
// "Add to cart" fires `GET /add_to_cart/{id}` and, on success, reveals the
// #cartModal element — that's the real call/response shape being stubbed here.
test('add-to-cart shows the confirmation modal (network call mocked)', async ({ page }) => {
  await page.route('**/add_to_cart/*', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<div>1</div>' })
  );

  await page.goto('/products');
  await page.locator('.add-to-cart').first().click();

  await expect(page.locator('#cartModal')).toBeVisible();
  await expect(page.getByText('Added!')).toBeVisible();
});
