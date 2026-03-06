# Commit Message Templates

## Session Checkpoint
```
Session checkpoint: 2025-01-15 14:30

Completed:
- Implemented user authentication
- Added login form component

In progress:
- Email verification (50%)

Notes:
- Blocked on SMTP config
```

## Pre-Operation
```
Checkpoint before: Database migration

About to run: prisma migrate dev
Risk: May alter table structure
Rollback: git checkout . && prisma migrate reset
```

## Work-In-Progress
```
WIP: Feature X implementation

Status: Incomplete, do not review
- [ ] Core logic done
- [ ] Tests incomplete

Will squash before merge.
```
