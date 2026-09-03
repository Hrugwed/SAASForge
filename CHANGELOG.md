# Changelog

All notable changes are documented here. This project follows Semantic Versioning after `1.0.0`; pre-1.0 releases may contain breaking factory-template changes with an explicit migration note.

## Unreleased

### Added

- Standalone, isolated product generation with versioned manifests.
- A dry-run-first, three-way standalone product upgrade engine with conflict protection, downgrade prevention, and rollback-safe application.
- Better Auth identity/tenancy, Stripe billing, Resend email, PostHog analytics, Inngest jobs, Cloudflare R2 storage, and Sentry observability boundaries.
- AI-native project instructions and reusable Codex/Claude skills.
- A one-command factory bootstrap, browser-safe blueprint composer, and continuously generated lean/full reference-product profiles.
- Database-backed auth and billing integration suites plus accessibility, keyboard, and bounded health-performance checks.
- A protected generated-product deployment workflow with commit-bound launch evidence, restore/rollback drills, and owned alert-routing gates.

### Changed

- Billing synchronization ignores stale Stripe events transactionally so older deliveries cannot overwrite newer entitlement state.
- Factory and generated-product diagnostics enforce Node `>=22.14.0 <23`; local bootstrap falls back to Prisma when Docker or Compose cannot start PostgreSQL.

### Security

- Fail-closed product database ownership, secret-safe doctor checks, redacted logs, signed webhooks, tenant-scoped storage, and CI supply-chain gates.
- Production launch evidence must match the exact 40-character release commit and package version before migrations or deployment.
