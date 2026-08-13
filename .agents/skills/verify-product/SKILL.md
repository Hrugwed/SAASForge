---
name: verify-product
description: Verify a generated SaaSForge product or factory change against risk-based quality and isolation gates. Use after generation, capability changes, migrations, or before handoff.
---

# Verify a product

1. Identify changed boundaries from `git diff`; do not begin with every test blindly.
2. Read applicable gates in `docs/production-readiness.md` and the closest `AGENTS.md`.
3. Run focused tests for the changed capability first.
4. Validate configuration rejects missing, malformed, and production-unsafe values.
5. For tenant data, test owner access, member access, outsider denial, unauthenticated denial, and cross-organization identifiers.
6. For webhooks/jobs, test invalid signatures/events, duplicates, reordering, retries, and partial failure.
7. Run formatting, lint, strict types, unit/integration tests, production build, and applicable browser journeys.
8. Verify a standalone export has no unresolved workspace imports when generator behavior changed.
9. Report commands and results exactly. Separate failures caused by the change from environmental blockers. Never convert an unrun check into a pass.
