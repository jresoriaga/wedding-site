# Edge Cases

## Partial Success
```
"Partial progress - verification shows issues:

$ npm test
Tests: 45 passed, 3 failed, 48 total

Cannot claim 'complete' - 3 failures remain."
```

## Verification Not Possible
```
"Implementation complete in code. However:
- Cannot verify: [reason]
- Confidence: 70% (code-level only)
- To verify: [specific commands when environment available]

NOT claiming 'working' until verified."
```

## Multiple Components
```
"Feature has 3 components:

done Database migration — Migration completed successfully
done API endpoint — HTTP/1.1 200 OK
fail UI component — 1 test failed

Cannot claim 'feature complete' - UI verification failed."
```
