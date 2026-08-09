# Factory roadmap

## Foundation

- [x] Monorepo, private factory control center, design tokens, configuration validation
- [x] CI quality gates, dependency updates, secret scanning
- [x] Headless product template and rollback-safe product generator
- [x] Local development and isolation documentation

## Identity and data

- [x] Better Auth email/password integration and protected application shell
- [x] Organization lifecycle, owner/admin/member policy, and isolation tests
- [x] PostgreSQL schema, Prisma migrations, local database, and backup policy
- [ ] Verified email and password reset delivery (activated with email module)

## Revenue

- [x] Server-owned product catalog, hosted Checkout, and customer portal adapter
- [x] Signed, idempotent webhooks and fail-closed internal entitlements
- [x] Cancellation and payment-failure access-state synchronization
- [x] Product generator integration that mounts billing only for a product
- [ ] Automated reconciliation job and refund-specific product workflows

## Communication and acquisition

- [x] Validated transactional email boundary and starter welcome template
- [x] Provider-neutral analytics event boundary
- [x] Product landing page, blog, legal, robots, sitemap, and metadata foundation
- [ ] Live Resend/PostHog credentials and product-specific event taxonomy
- [ ] Waitlist persistence, campaign templates, and programmatic SEO tools

## Operations

- [x] Health endpoints, audit data model, CI, and end-to-end journeys
- [x] Independent product environment, database, billing, domain, and deployment boundaries
- [ ] Sentry wiring, structured logs, uptime checks, and reconciliation jobs
- [ ] Admin/support tooling, privacy export/deletion, and incident runbooks
- [ ] Production restore drills and per-product launch readiness review

## Factory v1 exit proof

- [x] SignalDesk generated from the factory rather than hand-copied
- [x] Independent branding and frontend structure
- [x] Authentication, workspace provisioning, billing readiness, email, and analytics modules mounted
- [x] Lint, strict type checking, unit tests, production build, and Playwright customer journey passing
