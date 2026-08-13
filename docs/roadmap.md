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
- [x] Verified email, password reset, email change, and deletion delivery flows

## Revenue

- [x] Server-owned product catalog, hosted Checkout, and customer portal adapter
- [x] Signed, idempotent webhooks and fail-closed internal entitlements
- [x] Cancellation and payment-failure access-state synchronization
- [x] Product generator integration that mounts billing only for a product
- [x] Automated reconciliation job and documented refund-specific product decisions

## Communication and acquisition

- [x] Validated transactional email boundary and starter welcome template
- [x] Provider-neutral analytics event boundary
- [x] Product landing page, blog, legal, robots, sitemap, and metadata foundation
- [ ] Live Resend/PostHog credentials and product-specific event taxonomy
- [ ] Waitlist persistence, campaign templates, and programmatic SEO tools

## Operations

- [x] Health endpoints, audit data model, CI, and end-to-end journeys
- [x] Independent product environment, database, billing, domain, and deployment boundaries
- [x] Sentry wiring, structured logs, readiness checks, and reconciliation jobs
- [x] Narrow support diagnostics, privacy export guidance, and incident runbooks
- [ ] Production restore drills and per-product launch readiness review

## Factory exit proof

- [x] Generate lean and full disposable standalone validation products
- [ ] Prove independent product schemas, secrets, providers, and deployments
- [x] Prove authentication, workspace provisioning, billing, email, analytics, jobs, and storage modules locally
- [x] Pass lint, strict type checking, unit/integration tests, production builds, and Playwright journeys
- [ ] Record setup time, manual steps, agent context used, and recovery drill results
