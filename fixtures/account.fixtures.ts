import { test as base, expect, APIRequestContext } from '@playwright/test';
import { randomUser, NewAccount } from '@project/utils/testData';

type AccountFixtures = {
  registeredUser: NewAccount;
};

// Extends the base `test` with a `registeredUser` fixture: creates a throwaway
// account via the API before the test runs, hands the test the account data,
// then deletes it afterwards — regardless of whether the test passed or failed.
// This is the standard fixture shape: setup, `await use(value)`, teardown.
export const test = base.extend<AccountFixtures>({
  registeredUser: async ({ request }, use) => {
    const user = randomUser();

    const createResponse = await request.post('/api/createAccount', { form: user });
    const createBody = await createResponse.json();
    expect(createBody.responseCode).toBe(201);

    await use(user);

    await deleteAccount(request, user);
  },
});

async function deleteAccount(request: APIRequestContext, user: NewAccount) {
  const deleteResponse = await request.delete('/api/deleteAccount', {
    form: { email: user.email, password: user.password },
  });
  const deleteBody = await deleteResponse.json();
  expect(deleteBody.responseCode).toBe(200);
}

export { expect };
