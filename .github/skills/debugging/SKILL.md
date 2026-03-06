---
name: debugging
description: Systematic debugging process - ensures root cause investigation before attempting fixes. 4-phase protocol with framework-specific guidance for Laravel and Node.js.
---

# Systematic Debugging

## Core Principle

**ALWAYS find root cause before attempting fixes. Symptom fixes are failure.**

## The Iron Law

NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST. If you haven't completed Phase 1, you cannot propose fixes.

## When to Use

Use for ANY technical issue: test failures, query issues, auth bugs, validation failures, queue job failures, route errors, migration issues, N+1 problems, performance issues, memory leaks, event loop blocking.

## The Four Phases

### Phase 1: Root Cause Investigation

Read error messages carefully. Check logs. Enable query logging. Check recent changes (`git diff HEAD~5`). Reproduce consistently. Trace data flow.

### Phase 2: Pattern Analysis

Find working examples. Compare against framework conventions. Check official docs. Identify differences between working and broken code.

### Phase 3: Hypothesis and Testing

Form single hypothesis. Test minimally (ONE variable). Verify in REPL or isolated test. When you don't know — say so.

### Phase 4: Implementation

Create failing test case. Implement single fix. Verify fix. If 3+ fixes failed — question architecture.

## Red Flags — STOP and Follow Process

If you catch yourself thinking: "Quick fix for now", "Just try changing X", "Skip the test", "One more fix attempt (when already tried 2+)" — STOP. Return to Phase 1.

---

## Laravel-Specific Guidance

### Phase 1 Tools
Check Laravel logs, enable debug mode, use Telescope, reproduce in Tinker. See `references/phase-details.md`.

### Phase 3 Tools
Verify hypotheses in `php artisan tinker`. Run isolated tests with `php artisan test --filter=test_name`.

### Quick Reference

| Phase | Activities | Tools |
|-------|-----------|-------|
| 1. Root Cause | Check logs, Telescope, Tinker, recent changes | Laravel logs, Telescope |
| 2. Pattern | Find working examples, check docs | Official docs, framework GitHub issues |
| 3. Hypothesis | Form theory, test in Tinker | `php artisan tinker`, `--filter` |
| 4. Implementation | Create Pest test, fix, verify | Pest PHP |

### References
- Full phase details with code examples: `references/phase-details.md`
- Laravel-specific techniques: `references/laravel-techniques.md`
- Common debugging scenarios: `references/common-scenarios.md`

---

## Node.js-Specific Guidance

### Tool Equivalents

| Laravel | Node.js | Purpose |
|---------|---------|---------|
| Telescope | Clinic.js Doctor | Health check / overview |
| `dd()` / `dump()` | `node --inspect` + Chrome DevTools | Interactive inspection |
| `DB::listen()` | `prisma.$on('query')` | SQL query logging |
| `Log::debug()` | `pino` / `winston` | Structured logging |
| `php artisan tinker` | `node -e "..."` / REPL | Interactive testing |
| Xdebug profiling | `0x` / Clinic Flame | CPU flamegraphs |
| Horizon | BullMQ Dashboard | Job queue monitoring |

### Phase 1 Tools

**Prisma query logging**:
```typescript
prisma.$on("query", (e) => {
  console.log(`Query: ${e.query} | Duration: ${e.duration}ms`);
  if (e.duration > 100) console.warn(`SLOW QUERY (${e.duration}ms)`);
});
```

**Clinic.js for health check**:
```bash
clinic doctor -- node server.js    # CPU, I/O, event loop overview
clinic flame -- node server.js     # CPU profiling flamegraph
clinic bubbleprof -- node server.js  # I/O and async profiling
```

### Phase 3 Tools
```bash
node -e "const { prisma } = require('./src/lib/prisma'); ..."  # Quick REPL test
npx vitest run --reporter=verbose src/specific.test.ts          # Isolated test
```

### Node-Specific Debugging Concerns

#### Event Loop Blocking

```typescript
// BAD — Blocks event loop, starves all other requests
const data = fs.readFileSync("/large/file.csv");
const parsed = expensiveCSVParse(data);

// GOOD — Non-blocking I/O + offload CPU work to worker
import { Worker } from "worker_threads";
const data = await fs.promises.readFile("/large/file.csv");
const parsed = await runInWorker("./workers/csv-parser.js", data);
```

**Detection**: Monitor Event Loop Utilization (ELU):
```typescript
import { monitorEventLoopDelay } from "perf_hooks";
const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();
setInterval(() => { console.log(`Event loop p99: ${h.percentile(99) / 1e6}ms`); h.reset(); }, 5000);
```

#### Memory Leaks

```typescript
// COMMON LEAK — Growing Map without cleanup
const cache = new Map(); // Grows forever

// FIX — Use LRU cache with TTL
import { LRUCache } from "lru-cache";
const cache = new LRUCache({ max: 500, ttl: 1000 * 60 * 5 });
```

**Detection**: Heap snapshots in Chrome DevTools. Take snapshot at T0, run load, take snapshot at T1, use "Comparison" view.

#### Unhandled Rejections

```typescript
// MUST HAVE in every Node.js entry point
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection", { reason: reason instanceof Error ? reason.stack : reason });
});
process.on("uncaughtException", (error) => {
  logger.fatal("Uncaught Exception — shutting down", { error: error.stack });
  server.close(() => process.exit(1));
});
```

#### Stream Backpressure

```typescript
// BAD — Ignores backpressure, buffers grow until OOM
stream.on("data", (chunk) => res.write(chunk));

// GOOD — pipeline() handles backpressure automatically
import { pipeline } from "stream/promises";
await pipeline(source, transform, res);
```

**Rule**: Always use `pipeline()` instead of manual `.pipe()` chains. It propagates errors AND handles cleanup.

### Quick Reference

| Phase | Activities | Tools |
|-------|-----------|-------|
| 1. Root Cause | Check logs, Prisma events, recent changes | `pino`, `prisma.$on('query')`, `node --inspect` |
| 2. Pattern | Find working examples, check docs | Official docs, framework GitHub issues |
| 3. Hypothesis | Isolate in REPL, test ONE variable | `node -e "..."`, `vitest run --reporter=verbose` |
| 4. Implementation | Create failing test, fix, verify | Vitest, Clinic.js, heap snapshots |
