---
name: resilient-test-selectors
description: Non-brittle test selector patterns for UI code. Defines selector priority hierarchy, data-testid naming convention, and anti-patterns that break on refactoring.
---

# Resilient Test Selectors

## Core Principle

**Tests must survive UI refactoring.** Selector choice determines whether a test suite is an asset or a maintenance burden. Prefer selectors tied to semantic meaning (ARIA roles, labels) over visual presentation (CSS classes, DOM structure).

## When to Use

- Writing UI tests (@implementer, @qa)
- Reviewing test code for brittle selectors (@reviewer)
- Planning test strategy for UI features (@planner)
- Specifying testability requirements for UI features (@prompt)

## Selector Priority Hierarchy

Use the **highest-priority selector** that uniquely identifies the element. Fall through only when higher-priority options are unavailable.

| Priority | Selector | Resilience | Why |
|----------|----------|-----------|-----|
| 1 | `getByRole()` | Highest | ARIA roles survive refactoring AND validate WCAG compliance |
| 2 | `getByLabelText()` | High | Form labels survive refactoring AND validate WCAG compliance |
| 3 | `getByPlaceholderText()` | Medium | User-visible but less stable than labels |
| 4 | `getByText()` | Medium | User-visible but breaks on copy changes |
| 5 | `getByTestId()` / `data-testid` | Stable | Explicit and refactor-proof but disconnected from accessibility |

**Key insight**: Priorities 1-2 validate accessibility AND functionality simultaneously. Good WCAG compliance produces good test selectors. `getByRole('button', { name: 'Save changes' })` tests both that the element is accessible AND that the feature works.

## When to Use `data-testid`

Use `data-testid` as a **last resort** when no semantic selector is available:

- Container `<div>` elements with no ARIA role (e.g., status indicators, layout regions)
- Dynamically generated content where text/role is identical across siblings
- Non-interactive visual elements (progress bars, badges, charts)
- Elements where adding an ARIA role would be semantically incorrect

**If you need `data-testid`, first ask**: Could this element have a semantic role or label instead? If yes, add the role/label rather than a test ID.

## `data-testid` Naming Convention

**Pattern**: `<component>-<element>[-<qualifier>]`

```
login-submit-button        (component: login, element: submit-button)
user-card-avatar           (component: user-card, element: avatar)
nav-menu-toggle            (component: nav, element: menu-toggle)
dashboard-status-indicator (component: dashboard, element: status-indicator)
```

**For lists/collections**, use a unique business identifier, not array index:

```html
<!-- Good: stable across reordering -->
<div data-testid="user-card-usr_123">...</div>
<div data-testid="user-card-usr_456">...</div>

<!-- Bad: breaks when list order changes -->
<div data-testid="user-card-0">...</div>
<div data-testid="user-card-1">...</div>
```

## Anti-Patterns (Brittle Selectors)

These selectors WILL break during normal UI development:

| Anti-Pattern | Why It Breaks | Fix |
|-------------|--------------|-----|
| `.btn-primary` (CSS class) | Breaks on style/design system refactoring | `getByRole('button', { name: '...' })` |
| `div > span:nth-child(2)` (DOM path) | Breaks when markup structure changes | `getByText()` or `data-testid` |
| `#react-auto-123` (generated ID) | Changes between renders | `getByRole()` or `data-testid` |
| `[style="color: red"]` (inline style) | Breaks on design changes | `data-testid` with semantic name |
| `document.querySelector('.card')[2]` (index) | Breaks when items added/removed | `data-testid` with unique qualifier |

## Framework-Specific Patterns

### React / Next.js

```tsx
// Semantic (preferred) -- button is testable via role
<button type="submit" aria-label="Save changes">
  Save
</button>
// Test: screen.getByRole('button', { name: 'Save changes' })

// data-testid (last resort) -- no semantic role available
<div data-testid="upload-progress-bar" className="progress">
  {progress}%
</div>
// Test: screen.getByTestId('upload-progress-bar')
```

### Laravel Blade

```blade
{{-- Semantic (preferred) --}}
<button type="submit" aria-label="Save changes">Save</button>

{{-- data-testid (last resort) --}}
<div data-testid="order-status-{{ $order->id }}">{{ $order->status }}</div>
```

### Playwright (E2E)

```typescript
// Semantic (preferred)
await page.getByRole('button', { name: 'Submit order' }).click();
await page.getByLabel('Email address').fill('user@example.com');

// data-testid (last resort)
await page.getByTestId('checkout-summary').isVisible();
```

## Testability Checklist (for @implementer)

Before completing a UI component:

- [ ] All buttons have accessible names (text content or `aria-label`)
- [ ] All form fields have associated `<label>` elements or `aria-label`
- [ ] All links have descriptive text (not "click here")
- [ ] Interactive elements use semantic HTML (`<button>`, `<a>`, `<input>`)
- [ ] Non-semantic containers that need testing have `data-testid`
- [ ] List items use unique business identifiers in `data-testid`, not array indices
- [ ] No test relies on CSS classes, DOM paths, or generated IDs

## Testability Checklist (for @qa / @reviewer)

When reviewing tests:

- [ ] Tests use `getByRole()` or `getByLabelText()` as primary selectors
- [ ] `data-testid` is used only where no semantic selector exists
- [ ] No test uses CSS class selectors (`.class-name`)
- [ ] No test uses DOM path selectors (`nth-child`, complex XPath)
- [ ] No test uses auto-generated IDs
- [ ] `data-testid` values follow naming convention: `<component>-<element>[-<qualifier>]`
