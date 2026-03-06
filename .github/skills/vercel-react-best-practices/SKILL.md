---
name: vercel-react-best-practices
description: React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns. Triggers on tasks involving React components, Next.js pages, data fetching, bundle optimization, or performance improvements.
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
---

# Vercel React Best Practices

57 performance optimization rules for React and Next.js, prioritized by impact.

## When to Apply

- Writing new React components or Next.js pages
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Refactoring existing React/Next.js code
- Optimizing bundle size or load times

## Rule Categories by Priority

| Priority | Category | Impact | Rules |
|----------|----------|--------|-------|
| 1 | Eliminating Waterfalls | CRITICAL | 5 |
| 2 | Bundle Size Optimization | CRITICAL | 5 |
| 3 | Server-Side Performance | HIGH | 7 |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | 4 |
| 5 | Re-render Optimization | MEDIUM | 12 |
| 6 | Rendering Performance | MEDIUM | 9 |
| 7 | JavaScript Performance | LOW-MEDIUM | 12 |
| 8 | Advanced Patterns | LOW | 3 |

For the full rule list per category, see `references/categories.md`.

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/async-parallel.md
rules/bundle-barrel-imports.md
```

Each rule file contains: explanation, incorrect code example, correct code example, and references.
