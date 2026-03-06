---
name: api-resource-patterns
description: Best practices for Laravel API Resources including resource transformation, collection handling, conditional attributes, and relationship loading.
---

# API Resource Patterns

## Key Rules

- **Use `whenLoaded()`** for all relationships — prevents N+1 queries
- **Use `when()`** for conditional attributes — only include when condition is true
- **Use `mergeWhen()`** for conditional groups — merge admin-only fields
- **Paginate collections** — include meta (total, per_page, current_page, total_pages) and links (self, first, last, prev, next)
- **Add HATEOAS links** — self, related resources
- **Create separate resources** for different contexts — PostResource, PostListResource, PostDetailResource

## Best Practices

- Always use `whenLoaded()` for relationships (never `$this->user` directly)
- Use type hints on `toArray(Request $request): array`
- Keep resources focused — separate list vs detail resources
- Use `ResourceCollection` for paginated responses
- Include proper HTTP status codes (201 for create)
- Use `whenPivotLoaded()` for pivot data
- Format dates consistently with `->toISOString()`
- Use `withResponse()` for custom headers

## Checklist

- [ ] Resources transform models consistently
- [ ] Relationships loaded with `whenLoaded()`
- [ ] Conditional attributes use `when()`
- [ ] Collections include pagination metadata
- [ ] Links included for HATEOAS
- [ ] Type hints used
- [ ] Proper HTTP status codes
- [ ] No N+1 queries
- [ ] Consistent date formatting
- [ ] Appropriate wrapping strategy

## References

- All PHP code examples: `references/examples.md`
