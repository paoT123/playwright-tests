import { test, expect } from '@project/fixtures/account.fixtures';

// Demonstrates consuming the `registeredUser` fixture: the account already
// exists by the time this test body runs, and gets deleted automatically
// afterward — no manual create/delete calls needed in the test itself.
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
