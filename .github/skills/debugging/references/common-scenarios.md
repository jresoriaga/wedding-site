# Common Laravel Debugging Scenarios

## Scenario 1: N+1 Query Problem
```
Phase 1: Detect — Enable Model::preventLazyLoading()
Phase 2: Find — Check working code that uses with()
Phase 3: Hypothesis — "Adding with('user') will prevent the N+1"
Phase 4: Fix — Add test that counts queries, add with(), verify
```

## Scenario 2: Route Model Binding Not Working
```
Phase 1: Check route definition, controller parameter, custom key
Phase 2: Compare with working route binding
Phase 3: Hypothesis — "Parameter name doesn't match or model not found"
Phase 4: Fix — Ensure parameter matches or customize getRouteKeyName()
```

## Scenario 3: Mass Assignment Exception
```
Phase 1: Error says "Add [field] to fillable property"
Phase 2: Check other models' $fillable arrays
Phase 3: Hypothesis — "Field not in $fillable"
Phase 4: Add field to $fillable, test
```
