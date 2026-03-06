# GitHub Copilot Custom Instructions

## Skill Activation Protocol (MANDATORY)

Before proceeding with ANY task, evaluate and apply the appropriate skills from `.github/skills/`.

### Available Skills

**Core Enforcement Skills:**
- **version-gate**: System version checkpoint - auto-read by all agents before any work; blocks if `.github` directory is stale
- **honesty-protocol**: Constitutional honesty enforcement - truth over helpfulness, challenges false premises
- **evidence-first-claims**: Requires verification before any success/completion claims
- **checkpoint-discipline**: Git checkpoint enforcement - regular commits to prevent data loss
- **yagni-enforcement**: You Ain't Gonna Need It - prevents over-engineering

**Security Skills (OWASP & Secure Development):**
- **owasp-security-checklist**: OWASP Top 10:2025 compliance, security test templates, and secure code patterns - checklists, severity ratings, input validation, auth, data protection
- **ac-id-traceability**: Namespaced AC ID convention (AC-{SLUG}-{TYPE}{#}) for requirement tracing from spec through verification

**Vercel Skills (React/Next.js Best Practices):**
- **vercel-react-best-practices**: 57 rules for React/Next.js performance - waterfalls, bundle size, server perf, re-renders
- **web-design-guidelines**: 100+ UI/UX rules - accessibility, forms, animation, typography, dark mode, i18n

**Testing & Testability Skills:**
- **resilient-test-selectors**: Non-brittle UI test selectors - role-based priority hierarchy, data-testid naming convention, anti-patterns
- **playwright-e2e**: Playwright E2E testing patterns - config, auth storageState, CI integration, flakiness handling, AC ID traceability

**General Skills (Framework-Agnostic):**
- **brainstorming**: Feature ideation and planning before implementation
- **debugging**: 4-phase root cause analysis with Laravel and Node.js guidance

**Laravel Skills (PHP/Laravel Best Practices):**
- **laravel-tdd**: Test-Driven Development for Laravel with Pest PHP - write test first, watch fail, minimal code to pass
- **eloquent-best-practices**: Eloquent ORM optimization - N+1 prevention, eager loading, query scopes, mass assignment
- **api-resource-patterns**: Laravel API Resources - transformation, collections, conditional attributes, HATEOAS links

**Node.js Skills (Node.js/TypeScript Backend Best Practices):**
- **node-tdd**: Test-Driven Development for Node.js backends with Vitest - route testing, database reset patterns, Prisma mocking
- **prisma-best-practices**: Prisma ORM optimization - N+1 prevention, eager loading, batch operations, transactions, connection pooling
- **node-api-patterns**: Node.js API response patterns - Zod serialization, conditional fields, pagination, HATEOAS links

---

## Skill Activation Matrix

| Task Type | Required Skills |
|-----------|-----------------|
| React/Next.js code | vercel-react-best-practices, honesty-protocol |
| Laravel/PHP code | laravel-tdd, eloquent-best-practices, honesty-protocol |
| Laravel API development | api-resource-patterns, laravel-tdd, honesty-protocol |
| Laravel Eloquent/Models | eloquent-best-practices, laravel-tdd |
| Laravel feature planning | brainstorming, honesty-protocol |
| Laravel debugging | debugging, laravel-tdd |
| Node.js/TypeScript code | node-tdd, prisma-best-practices, honesty-protocol |
| Node.js API development | node-api-patterns, node-tdd, honesty-protocol |
| Node.js Prisma/Models | prisma-best-practices, node-tdd |
| Node.js feature planning | brainstorming, honesty-protocol |
| Node.js debugging | debugging, node-tdd |
| Architecture / threat modeling | owasp-security-checklist, honesty-protocol |
| General debugging | debugging, evidence-first-claims, honesty-protocol |
| UI/UX development | web-design-guidelines, resilient-test-selectors, honesty-protocol |
| Security review | owasp-security-checklist |
| Requirements & verification | ac-id-traceability, evidence-first-claims |
| Any code review | vercel-react-best-practices, web-design-guidelines, honesty-protocol |
| UI component testing | resilient-test-selectors, evidence-first-claims |
| Refactoring | vercel-react-best-practices, yagni-enforcement |
| Testability refactoring | resilient-test-selectors, web-design-guidelines, evidence-first-claims |
| E2E testing | playwright-e2e, resilient-test-selectors, ac-id-traceability, evidence-first-claims |
| Merge conflict resolution | owasp-security-checklist, ac-id-traceability, checkpoint-discipline, evidence-first-claims |
| Before claiming "done" | evidence-first-claims |
| Before commits | checkpoint-discipline |
| All tasks | honesty-protocol, evidence-first-claims (always active) |

---

## Activation Instructions

When a task matches the matrix above, read the relevant SKILL.md files before proceeding. Skills contain domain-specific rules, patterns, and checklists.

For **UI/UX tasks**, also fetch latest guidelines from: `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`

The **honesty-protocol** skill is always active: prioritize truth over helpfulness, challenge false premises, mark uncertainty explicitly.

---

## Severity Classification

Issues are classified by severity. CRITICAL and HIGH block merge.

| Severity | Definition |
|----------|------------|
| CRITICAL | Security vulnerability, data loss, or system failure |
| HIGH | Significant functionality broken, security concern |
| MEDIUM | Degraded experience, non-blocking issues |
| LOW | Style, minor improvements, suggestions |

---

## Communication Style (All Agents)

Use precise, direct language. Every sentence should convey necessary information — no filler phrases, no restating what the user already knows, no ceremonial transitions. Keep all technical detail and reasoning intact; cut only the words that add no meaning.

Individual agents define additional output format conventions (e.g., "Code Over Commentary", "Test Results Ledger") that build on this baseline.
