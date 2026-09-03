# Production-readiness standard

SaaSForge is production-ready only when every factory gate is complete. A generated product is production-ready only when the factory gates and its product-specific launch review are complete. This document is the canonical readiness status; roadmap checkboxes describe implementation progress only. Every item links to the dated [2026-09-03 evidence audit](validation/2026-09-03-readiness-audit.md), and every checked item has evidence for every clause.

## G0 — Clean clone

- [x] Supported runtime versions are pinned and checked. [Evidence](validation/2026-09-03-readiness-audit.md#g0---clean-clone)
- [x] One setup command creates safe local configuration without exposing secrets. [Evidence](validation/2026-09-03-readiness-audit.md#g0---clean-clone)
- [x] A doctor command diagnoses Docker, ports, environment, database, migrations, and providers. [Evidence](validation/2026-09-03-readiness-audit.md#g0---clean-clone)
- [ ] Windows, macOS, and Linux setup paths are either tested or explicitly scoped. [Partial evidence](validation/2026-09-03-readiness-audit.md#g0---clean-clone)
- [x] No personal paths, credentials, generated products, or build output are committed. [Evidence](validation/2026-09-03-readiness-audit.md#g0---clean-clone)

## G1 — Product isolation

- [x] Generator input is schema-validated and path-safe. [Evidence](validation/2026-09-03-readiness-audit.md#g1---product-isolation)
- [x] Generation is deterministic, rollback-safe, and tested with a snapshot or manifest. [Evidence](validation/2026-09-03-readiness-audit.md#g1---product-isolation)
- [ ] Each product owns its schema extensions, secrets, database, providers, domain, and deployment. [Partial evidence](validation/2026-09-03-readiness-audit.md#g1---product-isolation)
- [x] A product can be exported to a standalone repository. [Evidence](validation/2026-09-03-readiness-audit.md#g1---product-isolation)
- [x] Factory packages are versioned; generated products record their factory version. [Evidence](validation/2026-09-03-readiness-audit.md#g1---product-isolation)
- [x] Upgrade and conflict behavior is documented and tested. [Evidence](validation/2026-09-03-readiness-audit.md#g1---product-isolation)

## G2 — Identity and tenancy

- [ ] Signup, signin, signout, verification, password reset, session revocation, and account deletion work. [Partial evidence](validation/2026-09-03-readiness-audit.md#g2---identity-and-tenancy)
- [ ] OAuth is optional and safely configured. [Partial evidence](validation/2026-09-03-readiness-audit.md#g2---identity-and-tenancy)
- [ ] Organization creation, invitation, acceptance, role changes, transfer, removal, and switching work. [Partial evidence](validation/2026-09-03-readiness-audit.md#g2---identity-and-tenancy)
- [ ] Authorization and tenant isolation are tested for reads, writes, jobs, exports, and webhooks. [Partial evidence](validation/2026-09-03-readiness-audit.md#g2---identity-and-tenancy)
- [ ] Sensitive identity operations are rate-limited and audited. [Partial evidence](validation/2026-09-03-readiness-audit.md#g2---identity-and-tenancy)

## G3 — Revenue

- [x] Server-owned catalog, Checkout, portal, tax decision, and entitlement mapping are documented. [Evidence](validation/2026-09-03-readiness-audit.md#g3---revenue)
- [x] Webhooks are signed, idempotent, replay-safe, and resilient to reordering. [Evidence](validation/2026-09-03-readiness-audit.md#g3---revenue)
- [ ] Trials, upgrades, downgrades, cancellation, failure, refund, and reconciliation behavior are tested. [Partial evidence](validation/2026-09-03-readiness-audit.md#g3---revenue)
- [x] Access fails closed without permanently locking paid customers during transient provider failure. [Evidence](validation/2026-09-03-readiness-audit.md#g3---revenue)

## G4 — Platform capabilities

- [ ] Production email with domain verification, retries, templates, and delivery observability. [Partial evidence](validation/2026-09-03-readiness-audit.md#g4---platform-capabilities)
- [ ] Consent-aware analytics with a documented product event taxonomy. [Partial evidence](validation/2026-09-03-readiness-audit.md#g4---platform-capabilities)
- [ ] Structured logs, error reporting, traces, health/readiness checks, and actionable alerts. [Partial evidence](validation/2026-09-03-readiness-audit.md#g4---platform-capabilities)
- [ ] Durable jobs with retries, idempotency, scheduling, and dead-letter handling. [Partial evidence](validation/2026-09-03-readiness-audit.md#g4---platform-capabilities)
- [x] Private-by-default storage with signed access, validation, size limits, and deletion. [Evidence](validation/2026-09-03-readiness-audit.md#g4---platform-capabilities)
- [ ] Admin/support tooling uses explicit privileged authorization and audit trails. [Partial evidence](validation/2026-09-03-readiness-audit.md#g4---platform-capabilities)
- [ ] Data export, deletion, retention, and subprocessors are documented. [Partial evidence](validation/2026-09-03-readiness-audit.md#g4---platform-capabilities)

## G5 — Security and supply chain

- [x] Threat model covers identity, tenancy, billing, webhooks, generation, CI, providers, and AI tooling. [Evidence](validation/2026-09-03-readiness-audit.md#g5---security-and-supply-chain)
- [x] Secret, dependency, license, and static analysis run in CI. [Evidence](validation/2026-09-03-readiness-audit.md#g5---security-and-supply-chain)
- [ ] Security headers, CSRF/origin defenses, input limits, safe redirects, and abuse controls are tested. [Partial evidence](validation/2026-09-03-readiness-audit.md#g5---security-and-supply-chain)
- [ ] CI permissions are least-privilege; releases are reproducible and produce provenance/SBOM evidence. [Partial evidence](validation/2026-09-03-readiness-audit.md#g5---security-and-supply-chain)
- [x] `SECURITY.md` defines supported versions and private reporting. [Evidence](validation/2026-09-03-readiness-audit.md#g5---security-and-supply-chain)

## G6 — Quality and experience

- [x] Formatting, lint, types, unit, integration, build, and browser journeys pass. [Evidence](validation/2026-09-03-readiness-audit.md#g6---quality-and-experience)
- [ ] Critical flows meet coverage expectations based on risk, not a vanity global percentage. [Partial evidence](validation/2026-09-03-readiness-audit.md#g6---quality-and-experience)
- [ ] Accessibility and keyboard journeys pass automated and manual checks. [Partial evidence](validation/2026-09-03-readiness-audit.md#g6---quality-and-experience)
- [ ] Visual regression protects reusable UI without preventing product branding. [Blocked](validation/2026-09-03-readiness-audit.md#g6---quality-and-experience)
- [ ] Performance budgets and a basic load profile are enforced. [Partial evidence](validation/2026-09-03-readiness-audit.md#g6---quality-and-experience)

## G7 — Delivery and operations

- [ ] Preview, staging, and production boundaries are documented and automated. [Partial evidence](validation/2026-09-03-readiness-audit.md#g7---delivery-and-operations)
- [ ] Migrations are safe for rolling deployment and have recovery procedures. [Partial evidence](validation/2026-09-03-readiness-audit.md#g7---delivery-and-operations)
- [ ] Backups are encrypted, retained, monitored, and restored in a dated drill. [Partial evidence](validation/2026-09-03-readiness-audit.md#g7---delivery-and-operations)
- [ ] Rollback, incident response, status communication, and provider outage runbooks are exercised. [Partial evidence](validation/2026-09-03-readiness-audit.md#g7---delivery-and-operations)
- [ ] Uptime, error, latency, billing drift, email failure, and job backlog alerts have owners. [Partial evidence](validation/2026-09-03-readiness-audit.md#g7---delivery-and-operations)

## G8 — Public repository

- [x] README, quick start, architecture, provider setup, examples, and troubleshooting are accurate from a clean clone. [Evidence](validation/2026-09-03-readiness-audit.md#g8---public-repository)
- [x] License, contribution guide, code of conduct, security policy, changelog, release process, and ownership are present. [Evidence](validation/2026-09-03-readiness-audit.md#g8---public-repository)
- [x] Templates contain no misleading legal, compliance, security, or production-readiness claims. [Evidence](validation/2026-09-03-readiness-audit.md#g8---public-repository)
- [ ] Two disposable products with different capability profiles pass all applicable gates. [Partial evidence](validation/2026-09-03-readiness-audit.md#g8---public-repository)
