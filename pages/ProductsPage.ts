import { Page, Locator, expect } from '@playwright/test';

// Page Object Model: wraps the Products page's locators and actions so spec
// files read like plain English instead of repeating raw locators. Mirrors
// the flow already used directly in tests/ui/product-search.spec.ts.
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
