---
name: owasp-security-checklist
description: OWASP Top 10:2025 compliance, security test templates, and secure code patterns. Single source of truth for security reviews, secure implementation, and test coverage.
---

# OWASP Security Checklist & Secure Coding Patterns

## Core Principle

**Single source of truth for OWASP Top 10:2025 compliance, security test templates, and secure code patterns across all agents.**

## When to Use

- Security reviews and audits (@security, @reviewer)
- Writing security tests (@qa, @implementer)
- Code review security checks (@reviewer)
- Implementation security validation (@implementer)
- Planning security test coverage (@planner)
- Test coverage gap analysis

## OWASP Top 10:2025 Categories

| # | Category | Risk Level | Key Concern |
|---|----------|-----------|-------------|
| A01 | Broken Access Control | Critical | Unauthorized access to data/functionality |
| A02 | Security Misconfiguration | High | Insecure defaults, unnecessary features |
| A03 | Software Supply Chain | High | Vulnerable dependencies, build pipeline |
| A04 | Cryptographic Failures | High | Weak crypto, exposed sensitive data |
| A05 | Injection | Critical | SQL, XSS, command injection |
| A06 | Insecure Design | High | Missing security controls in design |
| A07 | Authentication Failures | Critical | Compromised identity |
| A08 | Data Integrity Failures | Medium | Unsigned code/data |
| A09 | Logging & Alerting Failures | Medium | Inability to detect attacks |
| A10 | Error Handling | Medium | Failing open, info leakage |

## Severity Rating Guide

- **CRITICAL**: Blocks merge. Authentication bypass, SQL injection, hardcoded secrets
- **HIGH**: Fix before release. Missing auth checks, weak crypto, open CORS
- **MEDIUM**: Fix next sprint. Missing logging, weak password policy
- **LOW**: Address when convenient. Minor config improvements

## Verification Approach

For each category, verify with:
1. **Checklist items** - See `references/web-top10.md` for full checklists
2. **Code evidence** - Cite `file:line` for each finding
3. **Test coverage** - Security tests exist for relevant categories

## Security Test Templates

Available test templates by domain (see `references/test-templates.md` for full code):
- **Input Validation Tests** - injection, length, null/undefined
- **Authentication Tests** - unauthenticated, invalid tokens, expired tokens
- **Authorization Tests** - IDOR prevention, role-based access
- **Data Protection Tests** - password hashing, sensitive field exclusion, log safety
- **Error Handling Tests** - stack trace suppression, generic credential errors
- **Accessibility Tests** - axe violations, keyboard navigation, accessible names
- **Performance Tests** - response time, concurrency, memory threshold

## Secure Code Patterns

Reusable secure implementation patterns by OWASP category (see `references/secure-patterns.md` for full code):
- **Parameterized Queries** (A03/A05)
- **Input Validation** (A03/A05)
- **Output Encoding** (A03/A05)
- **Secure Password Handling** (A04/A07)
- **Authorization Checks** (A01)
- **Secure Error Handling** (A09/A10)

## LLM Security

For AI/LLM features, also check OWASP Top 10 for LLM:2025. See `references/llm-top10.md`.

## References

- Full web checklists with code examples: `references/web-top10.md`
- LLM security categories: `references/llm-top10.md`
- Vulnerability/fix code pairs: `references/code-examples.md`
- Security test templates: `references/test-templates.md`
- Secure code patterns: `references/secure-patterns.md`
