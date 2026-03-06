# Response Format Examples

## WRONG (Blocked)
```
"I've implemented the feature and it's working correctly."
```

## RIGHT (Evidence shown)
```
"Feature implemented. Verification:

$ npm test -- --grep='feature-name'
PASS src/feature.test.ts
  Feature tests
    done handles valid input (12ms)
    done rejects invalid input (8ms)
Tests: 3 passed, 3 total

$ curl http://localhost:3000/api/feature
{"status":"success","data":{...}}

Feature complete with evidence above."
```

## Security Claims

### WRONG
```
"The code is secure."
```

### RIGHT
```
"Security verification by OWASP category:

A01 - Access Control: PASS
  - Authorization middleware: src/middleware/auth.ts:12-25
  - Ownership check: src/api/users.ts:42

A03 - Injection: PASS
  - Parameterized query: src/db/queries.ts:15

Evidence: All security tests passing
$ npm test -- --grep "Security"
Tests: 8 passed, 0 failed"
```
