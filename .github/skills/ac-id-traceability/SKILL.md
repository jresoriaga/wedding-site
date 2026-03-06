---
name: ac-id-traceability
description: Namespaced Acceptance Criteria ID convention for tracing requirements from specification through planning, implementation, testing, and verification. Format AC-{SLUG}-{TYPE}{#} prevents cross-feature collisions.
---

# AC ID Traceability

## Core Principle

**Every requirement gets a unique, namespaced ID that flows from @prompt through @verifier without cross-feature collisions.**

## ID Format

`AC-{SLUG}-{TYPE}{#}`

| Component | Description | Example |
|-----------|------------|---------|
| `SLUG` | Short uppercase feature identifier (3-8 chars) | `LOGIN`, `PROFILE`, `CART` |
| `TYPE` | Category prefix | `F`, `S`, `P`, `E`, `ERR` |
| `#` | Sequential number within feature + type | `1`, `2`, `3` |

### Category Prefixes

| Prefix | Category | Example |
|--------|----------|---------|
| `AC-{SLUG}-F#` | Functional requirements | `[AC-LOGIN-F1] User can authenticate with valid credentials` |
| `AC-{SLUG}-S#` | Security requirements | `[AC-LOGIN-S1] Rejects unauthenticated requests` |
| `AC-{SLUG}-P#` | Performance requirements | `[AC-LOGIN-P1] API responds in <200ms at p95` |
| `AC-{SLUG}-E#` | Edge cases | `[AC-LOGIN-E1] Handles empty input gracefully` |
| `AC-{SLUG}-ERR#` | Error handling | `[AC-LOGIN-ERR1] Returns 422 for invalid data` |

### SLUG Derivation Rules

The SLUG is assigned by @prompt during the specification phase:
1. Derive from the feature name (e.g., "User Login" → `LOGIN`, "Shopping Cart" → `CART`)
2. Keep it short: 3-8 uppercase characters
3. Use only letters and hyphens (e.g., `PW-RESET` for Password Reset)
4. Must be unique across all features in the project
5. State the SLUG at the top of the specification: **Feature SLUG: `LOGIN`**

## Pipeline Flow

```
@prompt          -- Assigns SLUG + AC IDs to each criterion
  |
@planner         -- References AC IDs in test specifications
  |
@implementer     -- Includes AC IDs in test names: it('[AC-LOGIN-F1] ...', () => {})
  |
@qa              -- Verifies AC ID coverage across test suite
  |
@verifier        -- Searches for [AC-{SLUG}-*] tags to verify all criteria met
```

## Test Naming Convention

```typescript
// Format: [AC-{SLUG}-{TYPE}{#}] description
it('[AC-LOGIN-F1] should authenticate user with valid credentials', () => {});
it('[AC-LOGIN-S1] should reject unauthenticated requests', () => {});
it('[AC-LOGIN-S2] should prevent brute force attacks', () => {});
it('[AC-LOGIN-P1] should respond within 200ms', () => {});
it('[AC-LOGIN-E1] should handle empty input gracefully', () => {});
```

## Verification Commands

```bash
# Find ALL criteria for a specific feature
grep -rn "AC-LOGIN" tests/

# Find a specific criterion
grep -rn "AC-LOGIN-F1" tests/

# Find all security criteria across ALL features
grep -rn "AC-.*-S[0-9]" tests/

# Run tests for a specific feature
npm test -- --grep "AC-LOGIN"

# Run a specific criterion's test
npm test -- --grep "AC-LOGIN-F1"
```

## Why Namespaced

Without namespacing, `AC-F1` from Feature A and `AC-F1` from Feature B collide:
```bash
# BAD: Returns matches from BOTH features — ambiguous
grep -rn "AC-F1" tests/

# GOOD: Returns only login feature matches — unambiguous
grep -rn "AC-LOGIN-F1" tests/
```

## Why This Matters

- @verifier searches for `[AC-{SLUG}-*]` to verify all criteria for a feature
- Tests without AC IDs cannot be automatically traced to requirements
- Namespaced IDs prevent ambiguity across incremental feature development
- Gaps in AC ID coverage indicate missing test coverage
- Enables automated, feature-scoped traceability audits
