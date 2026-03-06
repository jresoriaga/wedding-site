# Security Test Templates

## Input Validation Tests

```typescript
describe('Security: Input Validation', () => {
  const injectionPatterns = [
    "'; DROP TABLE users; --",
    "<script>alert('xss')</script>",
    "../../../etc/passwd",
    "{{constructor.constructor('return this')()}}",
  ];

  injectionPatterns.forEach(pattern => {
    it(`should reject injection attempt: ${pattern.slice(0, 20)}...`, () => {
      expect(() => processInput(pattern)).toThrow('Invalid input');
    });
  });

  it('should enforce maximum length', () => {
    const longInput = 'a'.repeat(10001);
    expect(() => processInput(longInput)).toThrow('Input too long');
  });

  it('should reject null/undefined input', () => {
    expect(() => processInput(null)).toThrow();
    expect(() => processInput(undefined)).toThrow();
  });
});
```

## Authentication Tests

```typescript
describe('Security: Authentication', () => {
  it('should reject unauthenticated requests', async () => {
    const response = await request(app).get('/api/protected').expect(401);
    expect(response.body.message).toBe('Authentication required');
  });

  it('should reject invalid tokens', async () => {
    await request(app)
      .get('/api/protected')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('should reject expired tokens', async () => {
    const expiredToken = generateExpiredToken();
    await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });
});
```

## Authorization Tests

```typescript
describe('Security: Authorization', () => {
  it('should prevent IDOR - user cannot access other user data', async () => {
    const user1Token = await getTokenForUser('user1');
    await request(app)
      .get('/api/users/user2/profile')
      .set('Authorization', `Bearer ${user1Token}`)
      .expect(403);
  });

  it('should enforce role-based access', async () => {
    const regularUserToken = await getTokenForUser('regular');
    await request(app)
      .delete('/api/admin/users/123')
      .set('Authorization', `Bearer ${regularUserToken}`)
      .expect(403);
  });
});
```

## Data Protection Tests

```typescript
describe('Security: Data Protection', () => {
  it('should hash passwords before storage', async () => {
    await createUser({ email: 'test@test.com', password: 'plaintext' });
    const user = await db.users.findOne({ email: 'test@test.com' });
    expect(user.password).not.toBe('plaintext');
    expect(user.password).toMatch(/^\$2[aby]\$/);
  });

  it('should not expose sensitive fields in API response', async () => {
    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${validToken}`);
    expect(response.body).not.toHaveProperty('password');
    expect(response.body).not.toHaveProperty('ssn');
  });

  it('should not log sensitive data', async () => {
    const logSpy = jest.spyOn(logger, 'info');
    await loginUser('test@test.com', 'secretPassword');
    const logCalls = logSpy.mock.calls.flat().join(' ');
    expect(logCalls).not.toContain('secretPassword');
  });
});
```

## Error Handling Tests

```typescript
describe('Security: Error Handling', () => {
  it('should not expose stack traces in production', async () => {
    const response = await request(app).get('/api/cause-error').expect(500);
    expect(response.body).not.toHaveProperty('stack');
    expect(response.body.message).toBe('Internal server error');
  });

  it('should use generic error for invalid credentials', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ email: 'test@test.com', password: 'wrong' })
      .expect(401);
    expect(response.body.message).toBe('Invalid credentials');
  });
});
```

## Accessibility Tests (WCAG)

```typescript
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('should have no axe violations', async () => {
    const { container } = render(<Component />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('should be keyboard navigable', () => {
    render(<Component />);
    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
  });

  it('should have accessible names', () => {
    render(<Component />);
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });
});
```

## Performance Tests

```typescript
describe('Performance', () => {
  it('[AC-{SLUG}-P1] should respond within 200ms', async () => {
    const start = performance.now();
    await request(app).get('/api/users').set('Authorization', `Bearer ${validToken}`);
    expect(performance.now() - start).toBeLessThan(200);
  });

  it('[AC-{SLUG}-P2] should handle 100 concurrent requests', async () => {
    const requests = Array(100).fill(null).map(() =>
      request(app).get('/api/health').expect(200)
    );
    const results = await Promise.all(requests);
    expect(results.every(r => r.status === 200)).toBe(true);
  });
});
```
