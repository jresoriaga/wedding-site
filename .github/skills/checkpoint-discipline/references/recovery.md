# Recovery Protocols

## If Work Is Lost (Committed)
```bash
git reflog
git checkout [commit-hash]
git checkout -b recovery-branch
git cherry-pick [commit-hash]
```

## If Uncommitted Work Is Lost
```bash
# Check IDE local history (VS Code: File -> Local History)
# Check filesystem recovery (macOS: Time Machine)
# Accept the loss — this is why we commit regularly
```
