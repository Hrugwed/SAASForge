---
name: security-review
description: Perform a threat-led review of SaaSForge or a generated product. Use for auth, authorization, tenancy, billing, webhooks, uploads, jobs, admin, AI tools, secrets, or launch reviews.
---

# Security review

## Review order

1. Read `docs/security/threat-model.md`, the relevant architecture docs, and the diff.
2. Map assets, trust boundaries, actors, entry points, external providers, and privileged operations.
3. Trace identity, tenant, role, entitlement, price, redirect, and resource identifiers from input to server enforcement.
4. Check injection, unsafe parsing, SSRF, open redirect, cross-tenant access, broken object authorization, replay, race conditions, data leakage, abusive cost amplification, and denial-of-service limits.
5. Check secrets in code, history-visible files, logs, browser bundles, CI, generated output, and error messages.
6. Check dependency and CI permissions, script execution, generator path safety, and untrusted repository instructions.
7. Require tests for exploitable boundaries. Prefer a concrete failing test over a speculative claim.
8. Rank findings by exploitability and impact. Include file/line evidence, remediation, and a verification method.

Do not claim compliance or absence of vulnerabilities. State scope, limitations, and untested assumptions.
