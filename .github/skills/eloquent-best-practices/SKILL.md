---
name: eloquent-best-practices
description: Best practices for Laravel Eloquent ORM including query optimization, relationship management, and avoiding common pitfalls like N+1 queries.
---

# Eloquent Best Practices

## Key Rules

- **Always eager load** relationships with `with()` — prevents N+1 queries
- **Select only needed columns** — `select(['id', 'name', 'email'])`
- **Use query scopes** for reusable logic — `scopePublished()`, `scopePopular()`
- **Define `$fillable`** for mass assignment protection — never use `$guarded = []`
- **Use casts** for type safety — datetime, array, boolean, integer
- **Chunk large datasets** — `chunk(200)` or `lazy()` for memory efficiency
- **Use database-level operations** — `->update()`, `->increment()` instead of loading into memory
- **Define return types** on relationships — `BelongsTo`, `HasMany`
- **Use `withCount()`** instead of `->count()` in loops
- **Prevent lazy loading in dev** — `Model::preventLazyLoading(!app()->isProduction())`

## Common Pitfalls

- **Querying in loops** — Use `whereIn()` instead of `find()` in a loop
- **Missing indexes** — Add indexes on foreign keys, status columns, composite query columns
- **N+1 queries** — Enable `preventLazyLoading()` to detect

## Checklist

- [ ] Relationships eagerly loaded where needed
- [ ] Only selecting required columns
- [ ] Using query scopes for reusability
- [ ] Mass assignment protection configured
- [ ] Appropriate casts defined
- [ ] Indexes on foreign keys and query columns
- [ ] Using database-level operations when possible
- [ ] Chunking for large datasets
- [ ] Model events used appropriately
- [ ] Lazy loading prevented in development

## References

- All PHP code examples (good/bad patterns): `references/examples.md`
