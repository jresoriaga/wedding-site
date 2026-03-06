---
name: playwright-e2e
description: Playwright E2E testing patterns for browser-level tests against deployed staging environments. Covers config, auth state, Page Object Model, CI integration, flakiness handling, and AC ID traceability.
---

# Playwright E2E Testing Patterns

## Overview

Write browser-level end-to-end tests that run against a deployed staging environment. Tests live in the local codebase (`e2e/`), launch a headless browser, and hit the staging URL over HTTP.

## When to Use

- Writing E2E tests for UI features (`@e2e`)
- Planning E2E test cases alongside unit tests (`@planner`)
- Reviewing E2E test quality (`@reviewer`, `@qa`)

## Configuration

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github']]
    : [['list']],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Auth setup — runs once, saves login state for all tests
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    // Uncomment for multi-browser:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'], storageState: 'e2e/.auth/user.json' },
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'], storageState: 'e2e/.auth/user.json' },
    //   dependencies: ['setup'],
    // },
  ],
});
```

### Using System Chrome Instead of Bundled Chromium

```typescript
// In the chromium project, add channel:
{
  name: 'chromium',
  use: {
    ...devices['Desktop Chrome'],
    channel: 'chrome', // Uses system Chrome — user sees the browser
    storageState: 'e2e/.auth/user.json',
  },
  dependencies: ['setup'],
},
```

### Environment Variables

```bash
# .env or .env.local (gitignored)
PLAYWRIGHT_BASE_URL=https://staging.app.example.com
E2E_USER_EMAIL=testuser@example.com
E2E_USER_PASSWORD=test-password-from-vault
```

**Never hardcode credentials in test files.** Use `.env` loaded via `dotenv` or Playwright's built-in env support.

## Authentication: storageState Pattern

Login once in a setup file. Reuse the auth state across all tests.

### e2e/auth.setup.ts

```typescript
import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.E2E_USER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.E2E_USER_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait for redirect after login
  await page.waitForURL('/dashboard');

  // Save auth state
  await page.context().storageState({ path: authFile });
});
```

Add `e2e/.auth/` to `.gitignore` — never commit auth state.

## Test File Structure

### File Naming

```
e2e/
├── auth.setup.ts              # Auth setup (runs first)
├── login.spec.ts              # [AC-LOGIN-*] tests
├── cart.spec.ts               # [AC-CART-*] tests
├── checkout.spec.ts           # [AC-CHECKOUT-*] tests
└── .auth/
    └── user.json              # Saved auth state (gitignored)
```

One file per feature SLUG. All tests in that file share the same AC ID prefix.

### Test Naming Convention

Every test title MUST include the AC ID from the spec:

```typescript
test('[AC-LOGIN-F1] user can log in with valid credentials', async ({ page }) => {
  // ...
});
```

This enables:
- `npx playwright test --grep "AC-LOGIN"` for focus testing
- `grep -rn "AC-LOGIN-F1" e2e/` for traceability
- Mapping results back to the spec's acceptance criteria

## Selector Patterns

Follow [`resilient-test-selectors`](../resilient-test-selectors/SKILL.md) priority strictly.

### Priority 1: Role-based (preferred)

```typescript
// Buttons
await page.getByRole('button', { name: 'Submit order' }).click();
await page.getByRole('button', { name: 'Cancel' }).click();

// Links
await page.getByRole('link', { name: 'Dashboard' }).click();

// Headings
await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

// Navigation
await page.getByRole('navigation').getByRole('link', { name: 'Settings' }).click();
```

### Priority 2: Label-based (form fields)

```typescript
await page.getByLabel('Email address').fill('user@example.com');
await page.getByLabel('Password').fill('secret');
await page.getByLabel('Remember me').check();
```

### Priority 3: Text-based (visible content)

```typescript
await expect(page.getByText('Order confirmed')).toBeVisible();
await page.getByText('View details').click();
```

### Priority 4: Test ID (last resort)

```typescript
// Only for non-semantic containers
await expect(page.getByTestId('checkout-summary')).toBeVisible();
await expect(page.getByTestId('order-status-badge')).toHaveText('Processing');
```

### Anti-Patterns (Never Use)

```typescript
// CSS classes — break on style refactoring
await page.locator('.btn-primary').click();           // BAD

// DOM paths — break on markup changes
await page.locator('div > span:nth-child(2)').click(); // BAD

// Generated IDs — change between renders
await page.locator('#react-auto-123').click();         // BAD

// XPath — fragile and hard to read
await page.locator('//div[@class="card"][2]').click(); // BAD
```

## Common Test Patterns

### Navigation and Page Verification

```typescript
test('[AC-DASH-F1] user sees dashboard after login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
```

### Form Submission

```typescript
test('[AC-PROFILE-F1] user can update profile', async ({ page }) => {
  await page.goto('/settings/profile');
  await page.getByLabel('Display name').fill('New Name');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Profile updated')).toBeVisible();
});
```

### Security: Unauthorized Access

```typescript
test('[AC-ADMIN-S1] non-admin cannot access admin panel', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login|\/403/);
});
```

### Security: Input Injection

```typescript
test('[AC-SEARCH-S1] search rejects script injection', async ({ page }) => {
  await page.goto('/search');
  await page.getByLabel('Search').fill('<script>alert("xss")</script>');
  await page.getByRole('button', { name: 'Search' }).click();
  // Verify no script execution — page still functional
  await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();
  // Verify sanitized output
  const content = await page.content();
  expect(content).not.toContain('<script>');
});
```

### Waiting for Async Operations

```typescript
test('[AC-CHECKOUT-F1] user can complete checkout', async ({ page }) => {
  await page.goto('/cart');
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Wait for payment processing
  await expect(page.getByRole('heading', { name: 'Order Confirmed' }))
    .toBeVisible({ timeout: 10_000 });
});
```

### Cross-Page Flow

```typescript
test('[AC-ORDER-F1] user can place order end-to-end', async ({ page }) => {
  // Step 1: Browse products
  await page.goto('/products');
  await page.getByRole('button', { name: 'Add to cart' }).first().click();

  // Step 2: View cart
  await page.getByRole('link', { name: 'Cart' }).click();
  await expect(page.getByTestId('cart-item-count')).toHaveText('1');

  // Step 3: Checkout
  await page.getByRole('button', { name: 'Checkout' }).click();
  await page.getByLabel('Card number').fill('4242424242424242');
  await page.getByRole('button', { name: 'Place order' }).click();

  // Step 4: Confirmation
  await expect(page).toHaveURL(/\/orders\/\w+/);
  await expect(page.getByRole('heading', { name: 'Order Confirmed' })).toBeVisible();
});
```

## Dynamic Content Timing

Playwright auto-waits for elements to be visible before acting, but it does **not** wait for an element's *content* to be populated. This causes race conditions with dynamically loaded controls — selects, autocompletes, and lists populated by async data.

### The Problem

```typescript
// FAILS — <select> is visible but options haven't loaded from API yet
await page.selectOption('#repo-select', 'testorg1/testrepo1');
```

`selectOption`, `check`, and `click` wait for the **element**, not its **content**. If a select's options come from an API call, the element can be visible while its options are still empty.

### The Fix: Wait for Content Before Interacting

```typescript
// Wait for the specific option to exist inside the select
await page.locator('#repo-select option[value="testorg1/testrepo1"]').waitFor();
await page.selectOption('#repo-select', 'testorg1/testrepo1');
```

### Other Dynamic Content Patterns

```typescript
// Autocomplete — wait for dropdown results before selecting
await page.getByLabel('Search users').fill('jane');
await page.getByRole('option', { name: 'Jane Doe' }).waitFor();
await page.getByRole('option', { name: 'Jane Doe' }).click();

// Table populated by API — wait for rows before asserting
await page.locator('table tbody tr').first().waitFor();
await expect(page.locator('table tbody tr')).toHaveCount(10);

// Dynamically loaded list — wait for specific item
await page.getByRole('listitem').filter({ hasText: 'Expected Item' }).waitFor();
```

### Rule

**If an element's content comes from an async source (API, state update, WebSocket), always wait for the specific content before interacting with it.** Waiting for the container element alone is not sufficient.

## Flakiness Handling

### Retries in Config

```typescript
// playwright.config.ts
retries: process.env.CI ? 2 : 0,
```

### Soft Assertions (Non-Blocking Checks)

```typescript
await expect.soft(page.getByTestId('promo-banner')).toBeVisible();
// Test continues even if promo banner is missing
```

### toPass() for Eventually-Consistent State

```typescript
await expect(async () => {
  const response = await page.request.get('/api/order/123');
  expect(response.status()).toBe(200);
  expect((await response.json()).status).toBe('confirmed');
}).toPass({ timeout: 15_000 });
```

### Trace on First Retry

```typescript
use: {
  trace: 'on-first-retry', // Captures trace only when retrying — not every run
},
```

View traces: `npx playwright show-trace test-results/trace.zip`

## CI Integration: GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on:
  deployment_status:
    # Runs after staging deploy completes

jobs:
  e2e:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci
      - run: npx playwright install --with-deps chromium

      - run: npx playwright test
        env:
          PLAYWRIGHT_BASE_URL: ${{ github.event.deployment_status.target_url }}
          E2E_USER_EMAIL: ${{ secrets.E2E_USER_EMAIL }}
          E2E_USER_PASSWORD: ${{ secrets.E2E_USER_PASSWORD }}

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

## PLAYWRIGHT.md Registry

The `@e2e` agent maintains `PLAYWRIGHT.md` at project root as its persistent memory. See the agent definition for the full format. Key sections:

- **Configuration**: Base URL, browser, auth strategy
- **Feature Coverage**: Per-SLUG table of AC IDs with test file, status, and notes
- **Pending**: Features with specs but no E2E tests
- **Regression History**: Date-stamped run summaries

The agent reads this before every run and updates it after every run.

## Directory Structure

```
project-root/
├── PLAYWRIGHT.md                    # E2E test registry (agent memory)
├── playwright.config.ts             # Playwright configuration
├── e2e/
│   ├── auth.setup.ts                # Login once, save storageState
│   ├── login.spec.ts                # [AC-LOGIN-*] tests
│   ├── cart.spec.ts                  # [AC-CART-*] tests
│   ├── checkout.spec.ts             # [AC-CHECKOUT-*] tests
│   └── .auth/                       # Saved auth state (gitignored)
│       └── user.json
├── docs/specs/
│   ├── LOGIN-spec.md                # Input: AC IDs from @prompt
│   ├── LOGIN-e2e-report.md          # Output: per-feature E2E results
│   └── ...
└── .github/workflows/
    └── e2e.yml                      # CI: run E2E after staging deploy
```

## Checklist (for @e2e agent)

Before completing a run:

- [ ] All AC IDs from the spec have corresponding E2E tests (or documented reason for skip)
- [ ] Every test title contains its AC ID: `[AC-{SLUG}-F#]`
- [ ] Selectors follow resilient-test-selectors priority (role > label > testid)
- [ ] No hardcoded credentials — env vars or storageState only
- [ ] `PLAYWRIGHT.md` updated with this run's results
- [ ] `docs/specs/{SLUG}-e2e-report.md` written with per-AC evidence
- [ ] Failures mapped to root cause category and handoff recommendation
