import { test, expect } from '@playwright/test';

test('POST /api/searchProduct returns matching products', async ({ request }) => {
  const response = await request.post('/api/searchProduct', {
    form: { search_product: 'Dress' },
  });

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.responseCode).toBe(200);
  expect(Array.isArray(body.products)).toBe(true);
  expect(body.products.length).toBeGreaterThan(0);

  for (const product of body.products) {
    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
  }
});

test('GET /api/productsList returns the full product list', async ({ request }) => {
  const response = await request.get('/api/productsList');

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.responseCode).toBe(200);
  expect(Array.isArray(body.products)).toBe(true);
  expect(body.products.length).toBeGreaterThan(0);
});
