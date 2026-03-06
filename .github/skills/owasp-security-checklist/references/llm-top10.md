# OWASP Top 10 for LLM Applications:2025

For features using AI/LLM capabilities.

## LLM01: Prompt Injection
- [ ] System prompts protected from manipulation
- [ ] User input sanitized before LLM processing
- [ ] Output filtered for sensitive data

## LLM02: Sensitive Information Disclosure
- [ ] Training data doesn't leak through responses
- [ ] PII filtered from outputs
- [ ] System prompts not exposed

## LLM05: Improper Output Handling
- [ ] LLM output sanitized before rendering (XSS prevention)
- [ ] No direct execution of LLM-generated code
- [ ] Output validated before database operations

## LLM06: Excessive Agency
- [ ] LLM actions bounded and reviewed
- [ ] Human-in-the-loop for sensitive operations
- [ ] Capability restrictions enforced

## LLM10: Unbounded Consumption
- [ ] Rate limiting on LLM API calls
- [ ] Token/cost limits per request
- [ ] Resource exhaustion prevention

*For full coverage (LLM03-04, LLM07-09), see [OWASP LLM Top 10](https://genai.owasp.org/llm-top-10/)*
