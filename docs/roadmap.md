# Factory roadmap

## Foundation

- Monorepo, starter application, design tokens, configuration validation
- CI quality gates, dependency updates, secret scanning
- Local development and deployment documentation

## Identity and data

- [x] Better Auth email/password integration and protected application shell
- [x] Organization lifecycle, owner/admin/member policy, and isolation tests
- [x] PostgreSQL schema, Prisma migrations, local database, and backup policy
- [ ] Verified email and password reset delivery (activated with email module)

## Revenue

- Products, prices, checkout, customer portal
- Idempotent webhooks and internal entitlement model
- Refund, cancellation, payment-failure, and reconciliation workflows

## Communication and acquisition

- Transactional email templates and delivery events
- Landing sections, pricing, waitlist, blog, SEO and analytics

## Operations

- Error monitoring, structured logs, audit events and uptime checks
- Admin/support tooling, privacy export/deletion, incident runbooks
- Restore drills, end-to-end tests and launch readiness review
