# Production-readiness standard

SaaSForge is production-ready only when every factory gate is complete. A generated product is production-ready only when the factory gates and its product-specific launch review are complete. Every checked item must link to automated output, a test, a runbook exercise, or a dated manual review.

## G0 — Clean clone

- [ ] Supported runtime versions are pinned and checked.
- [ ] One setup command creates safe local configuration without exposing secrets.
- [ ] A doctor command diagnoses Docker, ports, environment, database, migrations, and providers.
- [ ] Windows, macOS, and Linux setup paths are either tested or explicitly scoped.
- [ ] No personal paths, credentials, generated products, or build output are committed.

## G1 — Product isolation

- [ ] Generator input is schema-validated and path-safe.
- [ ] Generation is deterministic, rollback-safe, and tested with a snapshot or manifest.
- [ ] Each product owns its schema extensions, secrets, database, providers, domain, and deployment.
- [ ] A product can be exported to a standalone repository.
- [ ] Factory packages are versioned; generated products record their factory version.
- [ ] Upgrade and conflict behavior is documented and tested.

## G2 — Identity and tenancy

- [ ] Signup, signin, signout, verification, password reset, session revocation, and account deletion work.
- [ ] OAuth is optional and safely configured.
- [ ] Organization creation, invitation, acceptance, role changes, transfer, removal, and switching work.
- [ ] Authorization and tenant isolation are tested for reads, writes, jobs, exports, and webhooks.
- [ ] Sensitive identity operations are rate-limited and audited.

## G3 — Revenue

- [ ] Server-owned catalog, Checkout, portal, tax decision, and entitlement mapping are documented.
- [ ] Webhooks are signed, idempotent, replay-safe, and resilient to reordering.
- [ ] Trials, upgrades, downgrades, cancellation, failure, refund, and reconciliation behavior are tested.
- [ ] Access fails closed without permanently locking paid customers during transient provider failure.

## G4 — Platform capabilities

- [ ] Production email with domain verification, retries, templates, and delivery observability.
- [ ] Consent-aware analytics with a documented product event taxonomy.
- [ ] Structured logs, error reporting, traces, health/readiness checks, and actionable alerts.
- [ ] Durable jobs with retries, idempotency, scheduling, and dead-letter handling.
- [ ] Private-by-default storage with signed access, validation, size limits, and deletion.
- [ ] Admin/support tooling uses explicit privileged authorization and audit trails.
- [ ] Data export, deletion, retention, and subprocessors are documented.

## G5 — Security and supply chain

- [ ] Threat model covers identity, tenancy, billing, webhooks, generation, CI, providers, and AI tooling.
- [ ] Secret, dependency, license, and static analysis run in CI.
- [ ] Security headers, CSRF/origin defenses, input limits, safe redirects, and abuse controls are tested.
- [ ] CI permissions are least-privilege; releases are reproducible and produce provenance/SBOM evidence.
- [ ] `SECURITY.md` defines supported versions and private reporting.

## G6 — Quality and experience

- [ ] Formatting, lint, types, unit, integration, build, and browser journeys pass.
- [ ] Critical flows meet coverage expectations based on risk, not a vanity global percentage.
- [ ] Accessibility and keyboard journeys pass automated and manual checks.
- [ ] Visual regression protects reusable UI without preventing product branding.
- [ ] Performance budgets and a basic load profile are enforced.

## G7 — Delivery and operations

- [ ] Preview, staging, and production boundaries are documented and automated.
- [ ] Migrations are safe for rolling deployment and have recovery procedures.
- [ ] Backups are encrypted, retained, monitored, and restored in a dated drill.
- [ ] Rollback, incident response, status communication, and provider outage runbooks are exercised.
- [ ] Uptime, error, latency, billing drift, email failure, and job backlog alerts have owners.

## G8 — Public repository

- [ ] README, quick start, architecture, provider setup, examples, and troubleshooting are accurate from a clean clone.
- [ ] License, contribution guide, code of conduct, security policy, changelog, release process, and ownership are present.
- [ ] Templates contain no misleading legal, compliance, security, or production-readiness claims.
- [ ] Two disposable products with different capability profiles pass all applicable gates.
