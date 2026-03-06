# Git Commands Reference

## 4-Hour Checkpoint
```bash
git status
git add -A
git commit -m "Session checkpoint: $(date '+%Y-%m-%d %H:%M')

Work completed:
- [Brief summary]

In progress:
- [What's not complete]"
git log -1 --oneline
```

## Session Start
```bash
git status
# If uncommitted changes:
git stash  # or
git add -A && git commit -m "WIP: Resuming session"
git pull
git log --oneline -5
```

## Session End
```bash
git status
git add -A
git commit -m "Session end: $(date '+%Y-%m-%d %H:%M')

Completed:
- [What was done]

TODO next session:
- [What remains]"
git push
git status  # Should show "up to date"
```

## Pre-Operation
```bash
git add -A
git commit -m "Checkpoint before: [operation description]"
```

## Agent Handoff
```bash
git add -A
git commit -m "Handoff checkpoint: @[current] -> @[next]

Completed by @[current]:
- [What was accomplished]

For @[next]:
- [What needs to happen]"
git push
```

## Feature Branches
```bash
git checkout -b feature/descriptive-name
git add -A && git commit -m "..."
git push -u origin feature/descriptive-name
```
