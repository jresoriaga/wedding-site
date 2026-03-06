---
name: node-api-patterns
description: Best practices for Node.js API response patterns including Zod-based serialization, conditional attributes, pagination, and HATEOAS links.
---

# Node.js API Patterns

## Key Rules

- **Use Zod schemas for response shapes** — defines what the API returns, strips internal fields
- **Separate serializers for different contexts** — `serializeUser` vs `serializeUserList` vs `serializeUserDetail`
- **Use conditional spreading** for optional fields — `...(condition && { field: value })`
- **Paginate collections** — include meta (total, page, perPage, totalPages) and links (self, first, last, prev, next)
- **Add HATEOAS links** — self, related resources
- **Use cursor pagination** for feeds/large datasets — offset pagination degrades at scale
- **Validate input with Zod** — `z.object()` for request body, params, query
- **Return proper HTTP status codes** — 201 for create, 204 for delete, 422 for validation errors

## Response Serialization (Zod-First)

```typescript
// Define response schemas (like Laravel Resource)
export const UserResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  createdAt: z.string(),
});

// Separate list shape (like PostListResource vs PostResource)
export const UserListResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  role: z.string(),
});
```

## Serializer Functions (like Laravel Resource toArray)

```typescript
export function serializeUser(user: User): UserResponseType {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

export function serializeUserList(user: User): UserListResponseType {
  return { id: user.id, name: user.name, role: user.role };
}
```

## Conditional Fields (like whenLoaded / when / mergeWhen)

```typescript
export function serializeUserDetailed(
  user: User & { posts?: Post[]; _count?: { posts: number } },
  options?: { includeEmail?: boolean; isAdmin?: boolean }
) {
  return {
    id: user.id,
    name: user.name,
    // Like whenLoaded() — only include if relation was fetched
    ...(user.posts && { posts: user.posts.map(serializePostSummary) }),
    // Like when() — conditional attribute
    ...(options?.includeEmail && { email: user.email }),
    // Like mergeWhen() — conditional group for admin
    ...(options?.isAdmin && {
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      postCount: user._count?.posts ?? 0,
    }),
  };
}
```

## Fastify: Schema-Based Serialization (fastest)

```typescript
app.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/users/:id",
  schema: {
    params: z.object({ id: z.string().uuid() }),
    response: { 200: UserResponse, 404: z.object({ error: z.string() }) },
  },
  handler: async (request, reply) => {
    const user = await prisma.user.findUnique({ where: { id: request.params.id } });
    if (!user) return reply.status(404).send({ error: "Not found" });
    return serializeUser(user);
  },
});
```

## Offset Pagination (simple, good for admin/small datasets)

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
  links: { self: string; first: string; last: string; prev: string | null; next: string | null };
}

async function paginatePosts(page: number, perPage: number): Promise<PaginatedResponse<PostResponseType>> {
  const [posts, total] = await Promise.all([
    prisma.post.findMany({ skip: (page - 1) * perPage, take: perPage, orderBy: { createdAt: "desc" } }),
    prisma.post.count(),
  ]);
  const totalPages = Math.ceil(total / perPage);
  const baseUrl = "/api/posts";
  return {
    data: posts.map(serializePost),
    meta: { total, page, perPage, totalPages },
    links: {
      self: `${baseUrl}?page=${page}&perPage=${perPage}`,
      first: `${baseUrl}?page=1&perPage=${perPage}`,
      last: `${baseUrl}?page=${totalPages}&perPage=${perPage}`,
      prev: page > 1 ? `${baseUrl}?page=${page - 1}&perPage=${perPage}` : null,
      next: page < totalPages ? `${baseUrl}?page=${page + 1}&perPage=${perPage}` : null,
    },
  };
}
```

## Cursor Pagination (scalable, for feeds/large datasets)

```typescript
async function cursorPaginatePosts(cursor: string | undefined, limit: number) {
  const posts = await prisma.post.findMany({
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { createdAt: "desc" },
  });
  const hasMore = posts.length > limit;
  const data = hasMore ? posts.slice(0, -1) : posts;
  return {
    data: data.map(serializePost),
    meta: { hasMore, nextCursor: hasMore ? data[data.length - 1].id : null },
  };
}
```

## HATEOAS Links

```typescript
function resourceLinks(resourceType: string, id: string, extra?: Record<string, string>) {
  return { self: `/api/${resourceType}/${id}`, ...extra };
}

function serializePost(post: Post) {
  return {
    id: post.id,
    title: post.title,
    links: resourceLinks("posts", post.id, {
      author: `/api/users/${post.authorId}`,
      comments: `/api/posts/${post.id}/comments`,
    }),
  };
}
```

## Best Practices

- Never expose internal fields (passwordHash, deletedAt) in API responses
- Use serializer functions — never return raw Prisma models directly
- Keep list and detail serializers separate
- Use `z.infer<typeof Schema>` for TypeScript types from Zod schemas
- Format dates consistently with `.toISOString()`
- Include proper HTTP status codes (201 for create, 204 for delete)
- Always paginate collection endpoints

## Checklist

- [ ] Response schemas defined with Zod
- [ ] Serializer functions transform all models
- [ ] Separate list vs detail serializers
- [ ] Conditional fields use spreading (not returning internal data)
- [ ] Collections include pagination metadata
- [ ] Links included for HATEOAS
- [ ] Proper HTTP status codes
- [ ] No N+1 queries in handlers
- [ ] Consistent date formatting (ISO 8601)
- [ ] Input validated with Zod schemas
- [ ] Internal fields never exposed
