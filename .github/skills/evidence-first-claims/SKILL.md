---
name: evidence-first-claims
description: Blocks claims of 'complete', 'working', 'tested', 'fixed', 'secure' without verifiable evidence. All assertions require file:line references, command output, or test results.
user-invokable: false
---

# Evidence-First Claims (Anti-Fabrication)

## Core Principle

**NO CLAIM WITHOUT PROOF.** Every success claim requires supporting evidence shown in the response.

## Trigger Words

**Completion**: complete, done, finished, implemented, added, created
**Working**: working, works, functional, running, operational
**Testing**: tested, verified, confirmed, all tests passing
**Fix**: fixed, resolved, corrected, bug fixed
**Security**: secure, safe, protected, no vulnerabilities, OWASP compliant
**Deployment**: deployed, live, in production, pushed, released

## Evidence Requirements

| Claim | Required Evidence |
|-------|-------------------|
| "Build successful" | Build command output showing success |
| "Tests passing" | Test output with pass/fail counts |
| "Feature complete" | Test verification + manual verification |
| "Bug fixed" | Regression test passing |
| "No errors" | Console/log output showing no errors |
| "API working" | curl/fetch response with status code |
| "Secure" | OWASP checklist with file:line citations |

## Evidence Gate

**BLOCKED** — claims without proof: "It's working now", "All tests passing", "The code is secure"

**ALLOWED** — claims with evidence shown: command output, test results, file:line references

## Common Evasions to Block

- **Hedging**: "should be working", "appears fixed" — still requires evidence
- **Code review only**: "Based on the code, this should work" — run the actual tests
- **Future tense**: "This will fix the bug" — make the change, verify, THEN claim

## References

- Verification commands: `references/verification-commands.md`
- Response format examples: `references/response-format.md`
- Edge cases (partial success, not possible): `references/edge-cases.md`
