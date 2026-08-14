# Changelog

All notable changes are documented here. This project follows Semantic Versioning after `1.0.0`; pre-1.0 releases may contain breaking factory-template changes with an explicit migration note.

## Unreleased

### Added

- Standalone, isolated product generation with versioned manifests.
- A dry-run-first, three-way standalone product upgrade engine with conflict protection, downgrade prevention, and rollback-safe application.
- Better Auth identity/tenancy, Stripe billing, Resend email, PostHog analytics, Inngest jobs, Cloudflare R2 storage, and Sentry observability boundaries.
- AI-native project instructions and reusable Codex/Claude skills.

### Security

- Fail-closed product database ownership, secret-safe doctor checks, redacted logs, signed webhooks, tenant-scoped storage, and CI supply-chain gates.
