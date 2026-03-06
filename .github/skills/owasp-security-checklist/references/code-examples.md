# OWASP Vulnerability/Fix Code Pairs

## A01: Broken Access Control

```typescript
// VULNERABLE: No ownership check
app.get('/api/documents/:id', (req, res) => {
  return db.documents.findById(req.params.id);
});

// SECURE: Ownership validation
app.get('/api/documents/:id', requireAuth, (req, res) => {
  const doc = await db.documents.findById(req.params.id);
  if (doc.ownerId !== req.user.id) throw new ForbiddenError();
  return doc;
});
```

## A02: Security Misconfiguration

```typescript
// VULNERABLE: Open CORS
app.use(cors({ origin: '*' }));

// SECURE: Restrictive CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}));

// VULNERABLE: Detailed errors
catch (error) { return res.json({ error: error.stack }); }

// SECURE: Generic errors
catch (error) {
  logger.error(error);
  return res.status(500).json({ error: 'Internal server error' });
}
```

## A04: Cryptographic Failures

```typescript
// VULNERABLE: Weak hashing
const hash = crypto.createHash('md5').update(password).digest('hex');

// SECURE: Strong hashing
const hash = await bcrypt.hash(password, 12);

// VULNERABLE: Hardcoded secret
const JWT_SECRET = "my-secret-key";

// SECURE: Environment variable
const JWT_SECRET = process.env.JWT_SECRET;
```

## A05: Injection

```typescript
// VULNERABLE: SQL injection
const query = `SELECT * FROM users WHERE email = '${email}'`;

// SECURE: Parameterized query
const query = 'SELECT * FROM users WHERE email = ?';
await db.query(query, [email]);

// VULNERABLE: Command injection
exec(`convert ${filename} output.pdf`);

// SECURE: No shell, arguments array
execFile('convert', [filename, 'output.pdf']);

// VULNERABLE: XSS
element.innerHTML = userContent;

// SECURE: Encoded output
element.textContent = userContent;
```

## A07: Authentication Failures

```typescript
// VULNERABLE: Weak session
res.cookie('session', token);

// SECURE: Protected session
res.cookie('session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 3600000
});

// VULNERABLE: No rate limiting
app.post('/login', loginHandler);

// SECURE: Rate limited
app.post('/login', rateLimiter({ max: 5, windowMs: 60000 }), loginHandler);
```

## A09: Logging Failures

```typescript
// VULNERABLE: Sensitive data in logs
logger.info('Login', { email, password });

// SECURE: No sensitive data
logger.info('Login attempt', { email, success: false });

// VULNERABLE: No security logging
async function deleteUser(id) {
  await db.users.delete(id);
}

// SECURE: Audit logging
async function deleteUser(id, performedBy) {
  await db.users.delete(id);
  auditLogger.info('User deleted', { targetId: id, performedBy, timestamp: new Date() });
}
```
