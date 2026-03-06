# Verification Commands

## Build Verification
```bash
npm run typecheck  # Must show 0 errors
npm run lint       # Must show 0 errors
npm run build      # Must show success

mypy src/          # Python: 0 errors
ruff check .       # Python: 0 errors
```

## Test Verification
```bash
npm test                    # Show pass/fail counts
npm test -- --coverage      # Show coverage %
pytest -v                   # Python
go test -v ./...            # Go
php artisan test            # Laravel
```

## API Verification
```bash
curl -I http://localhost:3000/api/endpoint
curl http://localhost:3000/api/endpoint | jq
```

## Security Verification
```bash
npm audit
npx eslint --ext .ts src/ --rule 'security/*'
git secrets --scan
```
