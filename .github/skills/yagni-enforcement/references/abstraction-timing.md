# Abstraction Timing

## Too Early (BLOCKED)
```typescript
// Abstraction before multiple use cases
interface Repository<T> {
  find(id: string): Promise<T>;
  create(data: Partial<T>): Promise<T>;
}
class UserRepository implements Repository<User> {
  // Generic interface with only one implementation
}
```

## Just Right (REFACTOR Phase)
```typescript
// First: Direct implementation
class UserRepository {
  find(id: string): Promise<User> { ... }
}
// Later (when OrderRepository is needed):
// Extract interface during REFACTOR phase
```

## Rule of Three

1. First time: Write it inline
2. Second time: Copy with minimal changes
3. Third time: NOW extract abstraction

```typescript
// First handler
async function handleUserRequest(req) {
  const user = await db.users.findById(req.params.id);
  if (!user) throw new NotFoundError('User not found');
  return user;
}

// Second handler (still inline)
async function handleOrderRequest(req) {
  const order = await db.orders.findById(req.params.id);
  if (!order) throw new NotFoundError('Order not found');
  return order;
}

// Third time — NOW extract
async function findOrThrow<T>(
  finder: () => Promise<T | null>,
  entityName: string
): Promise<T> {
  const result = await finder();
  if (!result) throw new NotFoundError(`${entityName} not found`);
  return result;
}
```
