# OWASP Top 10:2025 — Full Checklists

## A01: Broken Access Control

- [ ] Authorization checks on ALL endpoints (default deny)
- [ ] No IDOR (Insecure Direct Object Reference) vulnerabilities
- [ ] Proper RBAC/ABAC implementation
- [ ] No privilege escalation paths
- [ ] CORS configured restrictively
- [ ] Rate limiting on sensitive operations
- [ ] Directory listing disabled
- [ ] JWT/session tokens properly validated

## A02: Security Misconfiguration

- [ ] Secure defaults enabled
- [ ] Unnecessary features/services disabled
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] Error messages don't leak sensitive info
- [ ] Debug mode disabled in production
- [ ] Cloud storage permissions restricted
- [ ] Admin interfaces protected

## A03: Software Supply Chain Failures

- [ ] Dependencies from trusted sources
- [ ] No known CVEs in dependencies (npm audit, Snyk)
- [ ] Dependency versions pinned
- [ ] Lock files committed and verified
- [ ] CI/CD pipeline integrity verified
- [ ] Code signing where applicable
- [ ] SBOM maintained

## A04: Cryptographic Failures

- [ ] Sensitive data encrypted at rest (AES-256)
- [ ] TLS 1.2+ for all data in transit
- [ ] Strong password hashing (bcrypt cost 12+, argon2)
- [ ] No hardcoded secrets, keys, or credentials
- [ ] Secure random number generation
- [ ] Proper key management (rotation, storage)
- [ ] No deprecated algorithms (MD5, SHA1, DES)
- [ ] PII properly protected

## A05: Injection

- [ ] Parameterized queries for ALL database operations
- [ ] Input validation on ALL external inputs
- [ ] Output encoding for context (HTML, JS, SQL, URL, LDAP)
- [ ] No command injection (shell commands)
- [ ] No template injection
- [ ] No LDAP/XPath/header injection

## A06: Insecure Design

- [ ] Threat modeling performed
- [ ] Security requirements defined upfront
- [ ] Defense in depth implemented
- [ ] Fail-secure design (secure defaults)
- [ ] Business logic security considered
- [ ] Rate limiting on sensitive operations
- [ ] Account lockout after failed attempts

## A07: Authentication Failures

- [ ] Strong password policy (12+ chars, complexity)
- [ ] Secure session management (httpOnly, secure, sameSite)
- [ ] Protection against credential stuffing (rate limiting)
- [ ] MFA implemented where appropriate
- [ ] Secure password reset flow
- [ ] Account lockout after failures
- [ ] No default credentials
- [ ] Secure token storage

## A08: Software or Data Integrity Failures

- [ ] Signed updates and data
- [ ] Integrity checks on critical data
- [ ] Secure deserialization
- [ ] CI/CD pipeline security
- [ ] No auto-update from untrusted sources

## A09: Security Logging & Alerting Failures

- [ ] Security events logged (auth, access control, input validation)
- [ ] No sensitive data in logs (passwords, tokens, PII)
- [ ] Logs protected from tampering
- [ ] Alerting configured for anomalies
- [ ] Audit trail for sensitive operations
- [ ] Log format supports analysis (structured logging)

## A10: Mishandling of Exceptional Conditions

- [ ] All exceptions caught and handled
- [ ] System fails secure (deny on error)
- [ ] Error messages don't leak info
- [ ] Proper cleanup on failure
- [ ] No uncaught promise rejections
- [ ] Timeout handling for external calls
