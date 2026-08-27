# Test Case Backlog

Candidate cases for future practice, based on the confirmed feature inventory in
`PLAYWRIGHT_PRACTICE_UI_API.md`. Not yet automated.

## UI (5)

1. **Account signup** — Signup/Login page (`/login`) — verifies a new user can register
   with a unique email and lands on the "Account Created" confirmation.
2. **Login: valid and invalid credentials** — Signup/Login page (`/login`) — verifies a
   valid login succeeds (logged-in username shown) and an invalid password/email
   combination shows the "incorrect email or password" error without logging in.
3. **Browse/filter products by category or brand** — Products page (`/products`) —
   verifies selecting a category (or brand) in the left sidebar filters the grid to only
   matching products.
4. **Add to cart and view cart** — Product listing/detail page → Cart page (`/view_cart`)
   — verifies a product added from the listing (or detail page) appears in the cart with
   the correct name, quantity, and price.
5. **Contact Us form submission** — Contact Us page (`/contact_us`) — verifies filling in
   name, email, subject, and message and submitting shows the "success" confirmation
   message.

## API (5)

1. **GET /productsList sanity check** — `GET /api/productsList` — verifies the endpoint
   returns HTTP 200 with `responseCode: 200` and a non-empty `products` array.
2. **GET /brandsList sanity check** — `GET /api/brandsList` — verifies the endpoint
   returns HTTP 200 with `responseCode: 200` and a non-empty `brands` array.
3. **POST /searchProduct missing parameter (negative case)** — `POST /api/searchProduct`
   with no `search_product` field — verifies the body reports `responseCode: 400` with a
   "parameter is missing" message, even though the transport status is 200.
4. **POST /verifyLogin valid vs. invalid credentials** — `POST /api/verifyLogin` — verifies
   a registered email/password pair returns `responseCode: 200` ("User exists!") and a
   non-existent/mismatched pair returns the 404-style `responseCode` with "User not
   found!".
5. **Account round-trip: createAccount → getUserDetailByEmail → deleteAccount** —
   `POST /api/createAccount`, `GET /api/getUserDetailByEmail`, `DELETE /api/deleteAccount`
   — verifies a newly created account can be looked up by email with matching details,
   then is fully removed (subsequent lookup no longer finds it).

## Practice: using the example scaffolding (`pages/`, `fixtures/`, etc.)

Working examples now exist in `pages/`, `fixtures/`, `utils/`, `test-data/`,
`tests/mocks/`, and `tests/visual/` (see `docs/project-structure.md` for what each
one does). These cases are meant to extend or adapt that scaffolding, rather than
write everything from scratch.

1. **Extend `ProductsPage` with a `login` flow** — Login page (`/login`) — add a
   `LoginPage` class alongside `pages/ProductsPage.ts` with a `login(email,
   password)` method, then rewrite backlog UI case #2 (valid/invalid login) to use it
   instead of raw locators.
2. **Add a `cartPage` fixture** — Cart page (`/view_cart`) — write a fixture in
   `fixtures/` that adds a specific product to the cart via `page.goto` +
   `.add-to-cart` click before the test runs, so backlog UI case #4 can start directly
   from "cart already has one item" instead of repeating the add-to-cart steps.
3. **Data-drive the invalid-login API case** — `POST /api/verifyLogin` — loop over
   `test-data/invalid-logins.json` the same way `product-search-data-driven.spec.ts`
   loops over `search-terms.json`, asserting each row's `expectedResponseCode` and
   `expectedMessage`.
4. **Mock a `searchProduct` failure in the UI** — Products page (`/products`) — note
   first that the UI search doesn't call `/api/searchProduct` (it's a full page
   navigation to `/products?search=...`, confirmed by reading the page's inline JS);
   instead use `page.route('**/products?search=*', ...)` to fulfill a canned "no
   results" HTML page and assert the UI handles a zero-result search gracefully.
5. **Un-skip and tune the visual test** — Homepage (`/`) — un-skip
   `tests/visual/homepage.visual.spec.ts`, generate a baseline with
   `npx playwright test tests/visual --update-snapshots`, then narrow the
   screenshot locator (e.g. just the logo, not the whole `#header`) so the assertion
   is less likely to break on unrelated promo-banner changes.
6. **Wire up `global-setup.example.ts`** — whole suite — follow the comments at the
   top of `global-setup.example.ts` to rename it and its teardown counterpart, add
   `globalSetup`/`globalTeardown` to `playwright.config.ts`, and add a `storageState:
   '.auth/user.json'` project so cart/account tests can start already logged in
   instead of logging in through the UI each time.
