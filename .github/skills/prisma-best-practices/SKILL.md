---
name: prisma-best-practices
description: Best practices for Prisma ORM including query optimization, relationship management, and avoiding common pitfalls like N+1 queries.
---

# Prisma Best Practices

## Key Rules

- **Always eager load** relationships with `include` — prevents N+1 queries
- **Select only needed columns** — use `select` instead of returning full models
- **Use reusable query fragments** for scoping — extract `where` clauses into named objects
- **Use `createMany()` for batch inserts** — single query instead of N individual creates
- **Use interactive transactions** when queries depend on each other — `prisma.$transaction(async (tx) => {})`
- **Use database-level operations** — `updateMany()`, `increment/decrement` instead of loading into memory
- **Singleton Prisma client** in dev — prevents connection pool exhaustion on hot reload
- **Enable query logging** — `prisma.$on('query')` to detect slow queries (>100ms)
- **Choose relation load strategy** — `join` (default, DB-level) vs `query` (app-level) based on profiling
- **Use cursor pagination** for large datasets — offset pagination degrades at scale

## N+1 Prevention

```typescript
// BAD — N+1: 1 query for posts + N queries for authors
const posts = await prisma.post.findMany();
for (const post of posts) {
  const author = await prisma.user.findUnique({ where: { id: post.authorId } });
}

// GOOD — Eager loading with include (like Laravel's with())
const posts = await prisma.post.findMany({
  include: { author: true },
});
```

## Select Optimization

```typescript
// BAD — Fetches ALL columns on both tables
const posts = await prisma.post.findMany({ include: { author: true } });

// GOOD — Only fetch what you need
const posts = await prisma.post.findMany({
  select: {
    id: true, title: true, createdAt: true,
    author: { select: { id: true, name: true } },
  },
});
```

**Rule**: You cannot use `select` and `include` together. If using `select`, nest related data inside it.

## Batch Operations

```typescript
// BAD — N individual creates
for (const item of items) {
  await prisma.post.create({ data: item });
}

// GOOD — Single batch operation
await prisma.post.createMany({ data: items, skipDuplicates: true });

// GOOD — Batch updates
await prisma.post.updateMany({
  where: { status: "draft", createdAt: { lt: thirtyDaysAgo } },
  data: { status: "archived" },
});
```

## Transactions

```typescript
// Sequential transaction (batched into single round trip)
const [post, log] = await prisma.$transaction([
  prisma.post.update({ where: { id: 1 }, data: { status: "published" } }),
  prisma.auditLog.create({ data: { action: "publish", postId: 1 } }),
]);

// Interactive transaction (when queries depend on each other)
await prisma.$transaction(async (tx) => {
  const sender = await tx.account.update({
    where: { id: senderId },
    data: { balance: { decrement: amount } },
  });
  if (sender.balance < 0) throw new Error("Insufficient funds"); // Rolls back
  await tx.account.update({
    where: { id: recipientId },
    data: { balance: { increment: amount } },
  });
});
```

## Query Scoping (like Laravel's scopePublished)

```typescript
const publishedFilter = { status: "published" as const, publishedAt: { not: null } };
const popularFilter = (threshold = 100) => ({ viewCount: { gte: threshold } });

const posts = await prisma.post.findMany({
  where: { ...publishedFilter, ...popularFilter(50) },
});
```

## Connection Pooling

```typescript
// Singleton pattern — prevents hot-reload connection exhaustion
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

```bash
# Traditional server: tune to CPU count
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10"

# Serverless: start with 1 + PgBouncer
DATABASE_URL="postgresql://user:pass@pgbouncer:6432/db?pgbouncer=true&connection_limit=1"
```

## Soft Deletes (via Client Extensions)

```typescript
export const softDeleteExtension = Prisma.defineExtension({
  query: {
    $allModels: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async delete({ model, args }) {
        return prisma[model].update({ ...args, data: { deletedAt: new Date() } });
      },
    },
  },
});
const prisma = new PrismaClient().$extends(softDeleteExtension);
```

## Common Pitfalls

- **N+1 queries** — Enable Prisma query logging to detect: `prisma.$on('query', console.log)`
- **Missing indexes** — Add indexes on foreign keys, status columns, composite query columns in `schema.prisma`
- **Connection exhaustion** — Use singleton pattern in dev, PgBouncer in serverless
- **Unbounded queries** — Always use `take` (limit) on `findMany()` in API handlers

## Checklist

- [ ] Relationships eagerly loaded with `include` or nested `select`
- [ ] Only selecting required columns
- [ ] Using reusable query fragments for common filters
- [ ] Batch operations for bulk create/update/delete
- [ ] Interactive transactions for dependent queries
- [ ] Singleton Prisma client in development
- [ ] Connection pool configured for deployment target
- [ ] Query logging enabled in development
- [ ] Indexes on foreign keys and frequently queried columns
- [ ] Cursor pagination for large datasets
- [ ] Soft delete via client extensions (not deprecated middleware)
