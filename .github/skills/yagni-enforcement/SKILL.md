---
name: yagni-enforcement
description: Minimal implementation discipline. Blocks over-engineering during GREEN phase. Only write code that makes current test pass. Prevents speculative features and premature abstraction.
---

# YAGNI Enforcement (Minimal Implementation)

## Core Principle

**YOU AREN'T GONNA NEED IT.** Write only the code needed to pass the current test.

## The YAGNI Rule

During GREEN phase, ask: **"Is this needed to pass the test?"**
- YES: Write it
- NO: Don't write it

## Blocked Patterns

- **"While I'm Here"** — Implementing user registration + email verification + password reset + social login. Implement ONLY what the current test requires.
- **"Future-Proofing"** — Adding config options, generic factories, extra parameters "in case we need them later." Implement for current requirements.
- **"Might Need It"** — Adding caching hooks, customization options, generic abstractions. Build for what you know.

## Decision Framework

1. Does a failing test require this? NO → Stop
2. Is this the MINIMUM code to pass? NO → Simplify
3. Am I adding options/config/flexibility? YES → Remove them
4. Am I building for imagined requirements? YES → Remove them

## YAGNI Violations Checklist

- [ ] No unused parameters
- [ ] No empty interface implementations
- [ ] No configuration options without tests
- [ ] No generic types with single implementation
- [ ] No "future" or "todo: later" comments for features
- [ ] No optional parameters that are never used
- [ ] No abstract classes with single subclass

## Refactoring is Different

In REFACTOR phase, you CAN: extract duplicated code, improve naming, add abstraction for existing patterns.
But NOT: add new features, add untested code paths, expand scope.

## References

- Minimal vs over-engineered examples: `references/examples.md`
- Abstraction timing and Rule of Three: `references/abstraction-timing.md`
