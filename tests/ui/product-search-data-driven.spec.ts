import { test, expect } from '@playwright/test';
import { ProductsPage } from '@project/pages/ProductsPage';
import searchTerms from '@project/test-data/search-terms.json';

// Same flow as tests/ui/product-search.spec.ts, but demonstrates two patterns
// together: driving the page through a Page Object instead of raw locators,
// and looping over a static data file instead of hardcoding one search term.
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
