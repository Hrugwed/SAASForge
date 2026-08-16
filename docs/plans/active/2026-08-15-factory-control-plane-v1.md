# Factory control plane v1

## Outcome

An authenticated operator can use the private dashboard to inspect the real local product registry, reconcile each entry with its generated manifest, understand factory-version drift and missing operational artifacts, and copy safe product commands without exposing secrets or executing product-controlled code from the browser.

## Context

The generator writes standalone products under `products/<slug>`, records successful generation in `apps/factory/src/generated/products.json`, and writes a versioned `saasforge.manifest.json` inside each product. The dashboard currently imports the registry as trusted static JSON and presents mostly descriptive factory content. Relevant boundaries are documented in `docs/architecture.md`, `docs/product-generator.md`, and `docs/production-readiness.md`.

## Non-goals

- Executing shell commands, migrations, deployment, provider setup, or upgrade application from the browser.
- Reading or displaying environment values, managed-file hashes, absolute host paths, customer data, or provider credentials.
- Aggregating live Stripe, PostHog, Sentry, Vercel, or other provider data in v1.
- Treating registry or manifest validity as production readiness.
- Adding product-specific business logic to the factory.

## Risks

- A malicious or stale registry path could escape the factory products directory or traverse a symlink.
- A malformed manifest could be mistaken for a healthy generated product.
- Server-only filesystem details could be serialized into a Client Component.
- Labels such as healthy, deployed, or production-ready could overstate the evidence.
- A dashboard-triggered command runner would execute product-controlled code with factory permissions.

## Milestones

- [x] Extract and reuse strict blueprint, registry, and v2 manifest contracts.
- [x] Add a server-only control-plane data access layer with bounded reads and path/link validation.
- [x] Replace static dashboard metrics and registry cards with reconciled product evidence.
- [x] Add a product detail route with artifact checks, factory drift, capability/provider expectations, and copy-only commands.
- [x] Cover empty, populated, malformed, missing, mismatched, traversal, and symlink states.
- [x] Pass the repository gate and desktop/mobile authenticated browser journeys.

## Acceptance

- Empty registry renders a truthful generator-ready state.
- A valid generated-product fixture renders its manifest identity, modules, managed-file count, version state, and artifact checks.
- Invalid registry entries, unsafe paths, missing repositories, malformed manifests, and registry/manifest mismatches are reported without throwing the whole dashboard or exposing raw values.
- No control-plane DTO contains an absolute path, environment value, managed-file fingerprint, or full manifest.
- Browser actions are navigation or clipboard guidance only; no product process is spawned by an HTTP request.
- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm test:e2e` pass.

## Decisions

- 2026-08-15: Keep v1 read-only and local. Executing repository code from an authenticated web surface is excluded until a separately threat-modeled worker boundary exists.
- 2026-08-15: Treat the generated manifest as evidence of provenance and structure, not runtime or production health.
- 2026-08-15: Reuse one strict contract between generator, upgrader, and control plane instead of duplicating casts in the dashboard.

## Progress

- [x] 2026-08-15: Audited the registry write path, manifest validation, authenticated shell, current dashboard data flow, and Next.js server-data security guidance.
- [x] 2026-08-15: Shared strict generator/registry/manifest contracts now drive generation, upgrades, and dashboard inspection.
- [x] 2026-08-15: Added fail-closed hosted operator authorization, dynamic bounded registry reads, derived product paths, link containment, sanitized DTOs, and copy-only commands.
- [x] 2026-08-15: Added real portfolio metrics, registry diagnostics, product evidence cards, and an inspected-product route with provider boundaries.
- [x] 2026-08-15: Full repository gate passed in 108.5 seconds: format, lint, typecheck, tests, license policy, production build, and four authenticated desktop/mobile Playwright journeys.
- [x] 2026-08-15: Two independent final reviews reported no remaining P0 or P1 findings after loopback binding, concurrent registry/slug locking, complete package-closure evidence, truthful access guidance, and command gating were verified.
- [ ] Complete final live-browser visual inspection, restart localhost, and commit the control plane.

## Verification evidence

- `pnpm format:check`: passed.
- `pnpm lint`: 12/12 packages passed.
- `pnpm typecheck`: 12/12 packages passed.
- `pnpm test`: 13/13 tasks passed; factory 15 tests and forge CLI 30 tests passed.
- `pnpm license:check`: 15 license expressions passed policy.
- `pnpm build`: production build passed and emitted the dashboard, products, product detail, and factory-access routes.
- `pnpm test:e2e`: four Chromium and mobile Chrome journeys passed.

## Recovery

Resume by inspecting `git status`, this plan, and the first incomplete milestone. The control plane is read-only, so recovery means reverting incomplete source changes; do not delete product directories or rewrite registry data. Generated products remain owned by the existing generator and manifest/upgrade mechanisms.
