// Plain helper functions — imported and called directly, not injected by Playwright
// like a fixture. Used to avoid hardcoding random/throwaway data inline in specs.

export function randomEmail(prefix = 'pw.practice'): string {
  const unique = `${Date.now()}.${Math.floor(Math.random() * 100000)}`;
  return `${prefix}.${unique}@example.com`;
}

export interface NewAccount {
  [key: string]: string;
  name: string;
  email: string;
  password: string;
  title: 'Mr' | 'Mrs';
  birth_date: string;
  birth_month: string;
  birth_year: string;
  firstname: string;
  lastname: string;
  company: string;
  address1: string;
  address2: string;
  country: string;
  zipcode: string;
  state: string;
  city: string;
  mobile_number: string;
}

// Full field list required by POST /api/createAccount, confirmed against
// https://automationexercise.com/api_list (API 11).
export function randomUser(overrides: Partial<NewAccount> = {}): NewAccount {
  return {
    name: 'Practice User',
    email: randomEmail(),
    password: 'Test1234!',
    title: 'Mr',
    birth_date: '10',
    birth_month: '5',
    birth_year: '1990',
    firstname: 'Practice',
    lastname: 'User',
    company: 'ACME',
    address1: '123 Test St',
    address2: '',
    country: 'United States',
    zipcode: '12345',
    state: 'CA',
    city: 'Testville',
    mobile_number: '1234567890',
    ...overrides,
  };
}
