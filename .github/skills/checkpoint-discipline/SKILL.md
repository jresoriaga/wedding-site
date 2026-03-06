---
name: checkpoint-discipline
description: Git checkpoint enforcement. Mandates commits at session boundaries, before risky operations, and every 4 hours. Prevents catastrophic work loss through systematic version control.
---

# Checkpoint Discipline (Session Guard)

## Core Principle

**COMMIT EARLY, COMMIT OFTEN.** Uncommitted work is unprotected work.

## Activation Triggers

- Session start/end
- Every 4 hours of work
- Before major/risky operations
- Before agent handoffs

## The 4-Hour Rule

Every 4 hours, commit your work. Balances commit frequency with meaningful changesets. Prevents losing more than half a day's work.

## Session Boundaries

**At START**: Check for uncommitted work, commit or stash, pull latest, check branch state.

**At END**: Check status, commit all work with summary, push to remote, verify push.

## Pre-Operation Checkpoint

**COMMIT FIRST before**: Database migrations, large refactoring, dependency updates, build system changes, configuration changes, deployment attempts, destructive commands.

## Agent Handoff

Before changing agents: commit, include what was accomplished and what's needed next, push for backup.

## Stashing vs Committing

- **Stash**: Switching branches temporarily, experimental changes, returning within minutes
- **Commit**: Work > 30 minutes, leaving for extended period, before risky operations, at checkpoints

## Checkpoint Checklist

- [ ] `git status` — check current state
- [ ] `git add -A` — stage changes
- [ ] `git commit -m "..."` — commit with message
- [ ] `git push` — backup to remote
- [ ] `git log -1` — verify commit

## References

- Git commands and examples: `references/git-commands.md`
- Recovery protocols: `references/recovery.md`
- Commit message templates: `references/commit-messages.md`
