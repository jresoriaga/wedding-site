# Secure Code Patterns

## Parameterized Queries (A03/A05)

```typescript
// NEVER: String concatenation
const query = `SELECT * FROM users WHERE id = '${userId}'`;

// ALWAYS: Parameterized query
const query = 'SELECT * FROM users WHERE id = ?';
const result = await db.query(query, [userId]);
```

## Input Validation (A03/A05)

```typescript
function validateUserInput(input: string): boolean {
  const pattern = /^[a-zA-Z0-9_-]+$/;
  return pattern.test(input) && input.length <= 100;
}

if (!validateUserInput(userInput)) {
  throw new ValidationError('Invalid input format');
}
```

## Output Encoding (A03/A05)

```typescript
import { escapeHtml, escapeJs } from './security';

const safeHtml = escapeHtml(userContent);  // HTML context
const safeJs = escapeJs(userContent);      // JS context
```

## Secure Password Handling (A04/A07)

```typescript
import bcrypt from 'bcrypt';

const hashedPassword = await bcrypt.hash(password, 12);
const isValid = await bcrypt.compare(inputPassword, hashedPassword);
```

## Authorization Checks (A01)

```typescript
async function getResource(resourceId: string, userId: string) {
  const resource = await db.findResource(resourceId);
  if (resource.ownerId !== userId) {
    throw new ForbiddenError('Access denied');
  }
  return resource;
}
```

## Secure Error Handling (A09/A10)

```typescript
// NEVER: Expose internal details
catch (error) { return { error: error.stack }; }

// ALWAYS: Generic message, log details
catch (error) {
  logger.error('Database error', { error, userId });
  throw new Error('An error occurred. Please try again.');
}
```
