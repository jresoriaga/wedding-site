# Minimal vs Over-Engineered Examples

## Example 1: Simple Return

**Test:**
```typescript
it('should return 5 for any input', () => {
  expect(calculate(10)).toBe(5);
});
```

**Minimal (Correct):**
```typescript
function calculate(n: number): number {
  return 5;
}
```

**Over-engineered (BLOCKED):**
```typescript
function calculate(n: number, options?: { mode: 'simple' | 'complex' }): number {
  const mode = options?.mode ?? 'simple';
  if (mode === 'simple') return 5;
  return n / 2; // Complex mode not needed yet!
}
```

## Example 2: Feature Implementation

**Test:**
```typescript
it('should validate email format', () => {
  expect(isValidEmail('test@example.com')).toBe(true);
  expect(isValidEmail('invalid')).toBe(false);
});
```

**Minimal (Correct):**
```typescript
function isValidEmail(email: string): boolean {
  return email.includes('@') && email.includes('.');
}
```

**Over-engineered (BLOCKED):**
```typescript
interface EmailValidationOptions {
  checkDNS?: boolean;
  allowedDomains?: string[];
  blockedDomains?: string[];
}
function isValidEmail(email: string, options?: EmailValidationOptions): boolean {
  // None of this is tested!
  return email.includes('@') && email.includes('.');
}
```
