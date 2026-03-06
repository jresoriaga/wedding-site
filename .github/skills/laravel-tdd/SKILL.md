---
name: laravel-tdd
description: Test-Driven Development specifically for Laravel applications using Pest PHP. Use when implementing any Laravel feature or bugfix - write the test first, watch it fail, write minimal code to pass.
---

# Test-Driven Development for Laravel

## Overview

Write the test first. Watch it fail. Write minimal code to pass.

## When to Use

Always for Laravel: new features, bug fixes, API endpoints, migrations, models, validation, policies, queue jobs, commands, middleware.

**Exceptions**: Throwaway prototypes, config files, view-only changes (no logic).

## The Laravel TDD Cycle

```
RED → Verify RED → GREEN → Verify GREEN → REFACTOR → Repeat
```

### RED — Write Failing Test
Write one minimal test showing what the feature should do.

### Verify RED — Watch It Fail
```bash
php artisan test --filter=test_name
```

### GREEN — Minimal Laravel Code
Write simplest code to pass the test.

### Verify GREEN — Watch It Pass
```bash
php artisan test
```

### REFACTOR — Clean Up
After green only: extract services, create policies, add query scopes, use events.

## Verification Checklist

- [ ] Migration test passes
- [ ] Model relationships tested
- [ ] Controller actions tested
- [ ] Validation rules tested
- [ ] Authorization tested
- [ ] Database state verified
- [ ] All tests passing
- [ ] Used RefreshDatabase
- [ ] Used factories

## Remember

Every Laravel feature → Test exists and failed first. Otherwise → Not TDD.

## References

- Test pattern examples (feature, database, auth, API): `references/test-patterns.md`
