# G0-G8 readiness evidence audit

Date: 2026-09-03

Scope: factory repository readiness. This is an evidence audit, not a release approval. `docs/production-readiness.md` remains the canonical gate status. A supported item has evidence for every clause; partial items remain open even when some underlying capability exists.

Status definitions:

- **Supported**: sufficient automated output, test coverage, exercise, or dated manual review exists to check the item.
- **Partial**: some evidence exists, but at least one clause or environment is not proved.
- **Blocked**: the required exercise or external environment evidence does not exist yet.

## G0 - Clean clone

1. **Supported - runtime versions.** Node and pnpm constraints are enforced by the [bootstrap tests](../../tooling/forge-cli/src/bootstrap-factory.test.mjs), [doctor tests](../../tooling/forge-cli/src/doctor.test.ts), `.nvmrc`, and `package.json`. The [2026-09-03 onboarding record](../plans/active/2026-09-03-onboarding-and-readiness.md) records a successful supported-runtime bootstrap.
2. **Supported - one-command setup.** The [bootstrap tests](../../tooling/forge-cli/src/bootstrap-factory.test.mjs) and [setup tests](../../tooling/forge-cli/src/setup.test.ts) cover safe secret generation, idempotence, command ordering, database fallback, occupied-port refusal, and sanitized failures. The 2026-09-03 onboarding record includes a Windows HTTP 200 rehearsal.
3. **Supported - doctor diagnostics.** The [doctor tests](../../tooling/forge-cli/src/doctor.test.ts) cover runtime, generated Prisma artifacts, database connectivity, migrations, and port ownership. The 2026-09-03 onboarding record documents a nine-test and live-runtime pass. Provider requirements remain configuration-aware rather than universally required.
4. **Partial - operating systems.** The [setup smoke workflow](../../.github/workflows/setup-smoke.yml) now runs the focused setup tests and real idempotent setup command on `windows-latest` and `macos-latest`; Ubuntu runs the [quality workflow](../../.github/workflows/quality.yml). A 2026-09-03 Windows run passed locally with the pinned Node and pnpm versions. The gate remains open until the hosted macOS job produces successful dated output.
5. **Supported - repository hygiene.** The [security workflow](../../.github/workflows/security.yml) runs Gitleaks with full history and least-privilege checkout settings. Generated products and local environments are ignored; the 2026-09-03 audit found no committed generated product, local environment, or build-output evidence. Continuous OS-specific smoke evidence is still tracked separately above.

## G1 - Product isolation

1. **Supported - validated and path-safe input.** The [generator tests](../../tooling/forge-cli/src/create-product.test.ts) cover schema rejection, traversal, linked roots, linked registry directories, and capability constraints. The dashboard [composer tests](../../apps/factory/src/lib/blueprint-composer.test.ts) reuse the browser-safe generator schema and cover slug normalization, dependency locking, strict validation, package closure, JSON export, and shell-safe encoded commands; [CLI tests](../../tooling/forge-cli/src/blueprint-cli.test.ts) cover decoding, malformed payloads, ambiguous options, and explicit-option compatibility.
2. **Supported - deterministic and rollback-safe generation.** The generator tests cover rollback of partial output and concurrent registry writes. The [2026-08-13 factory validation](2026-08-13-factory-v1.md) records deterministic managed manifests for lean and full products; the [2026-08-14 upgrade validation](2026-08-14-upgrade-engine.md) records rollback and idempotence evidence.
3. **Partial - independent ownership.** The [architecture contract](../architecture.md) assigns schemas, secrets, databases, providers, domains, and deployments to each product. The [reference-product tests](../../tooling/forge-cli/src/reference-product.test.ts) verify external output, profile-specific database ownership, no factory workspace, and no linked paths; a disposable full profile passed migrations and database-backed tests against an isolated PostgreSQL schema. Separate hosted provider, domain, credential, and deployment evidence is not yet recorded.
4. **Supported - standalone export.** The generator tests verify an independent dependency closure. The 2026-08-14 upgrade validation moved and exercised a generated repository outside the factory tree. The [reference-product workflow](../../.github/workflows/reference-products.yml) continuously regenerates lean and full profiles outside the checkout and resolves each repository's own lockfile before a frozen reinstall.
5. **Supported - version recording.** Generator and [upgrade tests](../../tooling/forge-cli/src/upgrade-product.test.ts) validate factory-version manifests and reject downgrades; the 2026-08-14 validation records a manifest upgrade from 0.1.0 to 0.2.0.
6. **Supported - upgrade behavior.** The 2026-08-14 validation records 26 focused tests and a standalone dry-run/apply/idempotence rehearsal.

## G2 - Identity and tenancy

1. **Partial - identity lifecycle.** The [database integration test](../../packages/auth/src/server.integration.test.ts) proves signup, persisted session lookup, workspace provisioning, signout, and session deletion. Signin, verification delivery, password reset, explicit session revocation, and account deletion are not all covered by a database-backed or browser journey.
2. **Partial - OAuth.** OAuth is optional by architecture, but there is no explicit disabled-by-default/configuration-safety test.
3. **Partial - organization lifecycle.** Automatic owner-workspace provisioning and owner/admin/member authorization are covered by the database integration test and [access tests](../../packages/auth/src/access.test.ts). Invitation, acceptance, role change, ownership transfer, removal, and switching are not all covered.
4. **Partial - tenant isolation.** Auth access, storage keys, jobs, and billing persistence have focused tests, but there is no single dated proof spanning tenant-owned reads, writes, jobs, exports, and webhooks.
5. **Partial - sensitive operations.** [Identity guidance](../database-auth.md) documents tighter limits and audit expectations, but executable rate-limit and audit coverage for every sensitive operation is absent.

## G3 - Revenue

1. **Supported - server-owned billing contract.** [Billing guidance](../billing.md), [catalog tests](../../packages/billing/src/config.test.ts), and [entitlement tests](../../packages/billing/src/entitlements.test.ts) cover server-owned prices and entitlement mapping. Tax remains an explicit per-product decision in the billing guidance.
2. **Supported - webhook safety.** [Webhook tests](../../packages/billing/src/webhook.test.ts) cover signature verification, mutated payload rejection, deduplication, retries, and payload mismatch. The [database integration test](../../packages/billing/src/server.integration.test.ts) proves persistent claims, completion, failure, and atomic retry attempts.
3. **Partial - subscription lifecycle.** Unit coverage normalizes Stripe states and reconciliation failures, but trials, upgrade, downgrade, cancellation, payment failure, refund, and reorder behavior lack a complete provider-sandbox journey.
4. **Supported - fail-closed access.** Entitlement tests cover unknown prices, terminal states, expiry, and a bounded past-due grace period.

## G4 - Platform capabilities

1. **Partial - production email.** [Email guidance](../email.md) and package tests cover the adapter and templates; live domain verification, delivery, retry, and observability evidence is product-specific and absent.
2. **Partial - analytics.** Analytics package tests cover a provider-neutral consent boundary. A dated product event taxonomy and live provider evidence are absent.
3. **Partial - observability.** [Observability tests](../../packages/observability/src/index.test.ts) cover structured, bounded, redacted logs, and factory health/readiness routes are tested. Deployed traces, error reporting, actionable alerts, and owners are not proved.
4. **Partial - durable jobs.** [Job tests](../../packages/jobs/src/index.test.ts) prove tenant context and idempotent events, while [job guidance](../jobs.md) defines retries and failure handling. Scheduling, durable-provider, dead-letter, and operational exercise evidence is incomplete.
5. **Supported - private storage contract.** [Storage tests](../../packages/storage/src/index.test.ts) cover tenant-prefixed private keys, cross-tenant and traversal rejection, content types, and size limits. [Storage guidance](../storage.md) defines signed access and deletion responsibilities.
6. **Partial - privileged support.** [Control-plane guidance](../control-plane.md) defines explicit operator organization authorization and a read-only boundary, but generated-product admin/support authorization and audit journeys are absent.
7. **Partial - privacy operations.** [Privacy guidance](../privacy-operations.md) documents export and deletion responsibilities. Product-specific retention, subprocessors, and exercised deletion/export evidence remain open.

## G5 - Security and supply chain

1. **Supported - threat model.** The [threat model](../security/threat-model.md) covers identity, tenancy, billing, webhooks, generation, CI, providers, and AI tooling and defines review triggers.
2. **Supported - CI security checks.** The [security workflow](../../.github/workflows/security.yml) runs CodeQL, Gitleaks, dependency audit, and license policy checks with pinned actions.
3. **Partial - application defenses.** Security headers and origin defenses are configured and documented, but executable coverage does not span headers, CSRF/origin rejection, input limits, safe redirects, and abuse controls.
4. **Partial - release supply chain.** CI permissions are explicitly minimized and actions are pinned. Reproducible release, provenance, and SBOM evidence is absent.
5. **Supported - security policy.** [SECURITY.md](../../SECURITY.md) defines the supported version, private reporting path, scope, and response targets.

## G6 - Quality and experience

1. **Supported - engineering gate.** The [2026-08-13 validation](2026-08-13-factory-v1.md) records format, lint, type, unit, license, build, and browser passes. The [quality workflow](../../.github/workflows/quality.yml) now also requires migrated PostgreSQL integration tests; the 2026-09-03 onboarding record records the new auth and billing integration suites passing locally.
2. **Partial - risk-based coverage.** Critical auth, authorization, billing, generator, and upgrade paths have focused tests, but there is no dated risk-to-coverage review accepting all critical flows.
3. **Partial - accessibility.** Factory and generated-product Playwright journeys now run WCAG 2.1 A/AA axe scans, and both include keyboard navigation assertions. The generated production workflow requires a current accessibility result with zero serious or critical violations and a passing keyboard journey through `pnpm launch:check`. Local browser execution remains blocked by the intercepted Playwright download, and hosted plus manual evidence has not been recorded.
4. **Blocked - visual regression.** No reusable-UI visual regression baseline and branding exception policy is enforced.
5. **Partial - performance.** Factory and generated-product Playwright suites now issue 20 concurrent health requests after warmup, require every response to be successful and at most 2 KiB, enforce p95 at or below 1 second, and print the measured profile into CI output. The generated production workflow requires a current passing performance record through `pnpm launch:check`. Hosted execution and a broader customer-journey load profile remain open.

## G7 - Delivery and operations

1. **Partial - environment boundaries.** [Architecture](../architecture.md) and [database/auth guidance](../database-auth.md) require isolated preview, staging, and production resources, but no hosted deployment automation evidence exists.
2. **Partial - migration safety.** The quality workflow deploys migrations into fresh PostgreSQL and the 2026-08-13 validation exercised migrations. Expand/contract review and recovery evidence for rolling deployment are absent.
3. **Partial - restore drill.** Backup requirements and isolated restore steps are documented. Generated production deployment now fails closed unless `docs/launch-evidence.json` records a successful restore within 180 days, its operator, isolated target, RPO/RTO, actual recovery time within RTO, and an HTTPS evidence link. No real product restore drill is yet recorded.
4. **Partial - operational exercises.** Rollback and incident procedures are documented. Generated production deployment now fails closed unless a rollback exercise within 180 days records its operator, source and restored deployment IDs, duration, and HTTPS evidence. Provider-outage and status-communication exercise evidence remains absent.
5. **Partial - alert ownership.** Generated production deployment now requires unique owner, route, test date within 90 days, and HTTPS evidence for uptime, errors, latency, billing drift, email failures, and job backlog. No deployed product has yet supplied or exercised those routes.

## G8 - Public repository

1. **Supported - repository guidance.** [README.md](../../README.md), the [context map](../context-map.md), and provider/capability documentation cover quick start, architecture, setup, and troubleshooting. The 2026-08-13 and 2026-09-03 validations exercised setup paths.
2. **Supported - community and release files.** [LICENSE](../../LICENSE), [CONTRIBUTING.md](../../CONTRIBUTING.md), [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md), [SECURITY.md](../../SECURITY.md), [CHANGELOG.md](../../CHANGELOG.md), [release guidance](../release-process.md), and [ownership instructions](../../AGENTS.md) are present.
3. **Supported - claim review.** The 2026-09-03 manual review found explicit statements that generated products are not automatically production-ready and found no template claim overriding product-specific legal, compliance, security, or launch review.
4. **Partial - reference products.** The [reference-product workflow](../../.github/workflows/reference-products.yml) now regenerates lean and full standalone profiles on pull requests and the main branch, then runs independent installation, setup, doctor, quality, build, and local-adapter browser journeys. The [reference-product tests](../../tooling/forge-cli/src/reference-product.test.ts) verify profile composition, external placement, ownership, and link-free output. Both profiles passed local engineering rehearsals on 2026-09-03, including isolated PostgreSQL migrations and database-backed tests for the full profile. The gate remains partial until the hosted workflow succeeds and real provider sandbox and applicable launch-gate evidence exists.

## Open evidence sequence

1. Record a successful hosted run of the Windows and macOS setup smoke jobs to close G0 operating-system evidence.
2. Record a successful hosted lean/full reference workflow run, then add real provider sandbox journeys for G1, G2, G3, G4, and G8.
3. Run the hosted WCAG/keyboard and health-load gates, perform the manual accessibility review, and add visual regression and risk-based coverage evidence for G6.
4. Populate a generated product's launch record with real deployment, migration recovery, restore, rollback, incident, outage, and alert-owner exercises for G7.
5. Produce release provenance and SBOM evidence for G5.
