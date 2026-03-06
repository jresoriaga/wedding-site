---
name: node-tdd
description: Test-Driven Development for Node.js backends using Vitest. Use when implementing any Node.js feature or bugfix - write the test first, watch it fail, write minimal code to pass.
---

# Test-Driven Development for Node.js

## Overview

Write the test first. Watch it fail. Write minimal code to pass.

## When to Use

Always for Node.js backends: new features, bug fixes, API endpoints, database migrations, models, validation, middleware, queue jobs, CLI commands.

**Exceptions**: Throwaway prototypes, config files, view-only changes (no logic).

## Test Runner Selection

| Scenario | Pick |
|----------|------|
| New TypeScript backend (Express/Fastify/Hono) | Vitest |
| Existing Jest project, not worth migrating | Jest with `@swc/jest` |
| Minimal dependency policy / small CLI tools | `node:test` |

## The Node.js TDD Cycle

```
RED → Verify RED → GREEN → Verify GREEN → REFACTOR → Repeat
```

### RED — Write Failing Test

Write one minimal test showing what the feature should do.

```typescript
// Fastify: Use app.inject() — no HTTP server needed
it("returns 200 with user data", async () => {
  const response = await app.inject({
    method: "GET",
    url: "/users/1",
    headers: { authorization: "Bearer valid-token" },
  });
  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({ id: 1, name: expect.any(String) });
});

// Express/Hono: Use supertest
it("creates post with valid data", async () => {
  const res = await request(app)
    .post("/api/posts")
    .set("Authorization", "Bearer valid-token")
    .send({ title: "Test Post", content: "Body text" })
    .expect(201);
  expect(res.body.data).toMatchObject({ title: "Test Post" });
});
```

### Verify RED — Watch It Fail

```bash
npx vitest run --reporter=verbose src/routes/users.test.ts
```

The test MUST fail. If it passes, the test is wrong — it's not testing new behavior.

### GREEN — Minimal Node.js Code

Write simplest code to pass the test. No extras.

### Verify GREEN — Watch It Pass

```bash
npx vitest run
```

### REFACTOR — Clean Up

After green only: extract services, add middleware, create utility functions, improve types.

## Database Reset Between Tests

### Pattern A: Transaction Rollback (fastest, recommended)

```typescript
beforeEach(async () => {
  await prisma.$executeRawUnsafe("BEGIN");
});
afterEach(async () => {
  await prisma.$executeRawUnsafe("ROLLBACK");
});
```

### Pattern B: Truncate All Tables (when transactions are insufficient)

```typescript
export async function resetDatabase() {
  const tableNames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;
  for (const { tablename } of tableNames) {
    if (tablename === "_prisma_migrations") continue;
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "public"."${tablename}" RESTART IDENTITY CASCADE`
    );
  }
}
```

### Pattern C: Schema Push Before Suite (one-time setup)

```bash
npx prisma db push --accept-data-loss  # In vitest.globalSetup.ts
```

**Important**: Run tests with `--pool=forks --poolOptions.forks.singleFork` to avoid parallel tests hitting the same database.

## Mocking Prisma in Unit Tests

```typescript
import { mockDeep } from "vitest-mock-extended";
import { PrismaClient } from "@prisma/client";

const prismaMock = mockDeep<PrismaClient>();

vi.mock("../src/lib/prisma", () => ({ prisma: prismaMock }));

it("returns user by id", async () => {
  prismaMock.user.findUnique.mockResolvedValue({
    id: "1", name: "Test User", email: "test@example.com",
  });
  const user = await getUserById("1");
  expect(user.name).toBe("Test User");
});
```

## Verification Checklist

- [ ] Route/endpoint test passes
- [ ] Middleware tested (auth, validation, rate limiting)
- [ ] Database operations tested (create, read, update, delete)
- [ ] Validation rules tested (valid and invalid input)
- [ ] Authorization tested (allowed and denied)
- [ ] Error responses tested (404, 422, 500)
- [ ] All tests passing
- [ ] Database reset between tests
- [ ] Used factories or seed helpers

## Remember

Every Node.js feature → Test exists and failed first. Otherwise → Not TDD.
