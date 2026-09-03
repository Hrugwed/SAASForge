# Onboarding and readiness improvements

## Outcome

Complete the eight review milestones in order, beginning with a clean-clone command that installs dependencies, prepares and checks PostgreSQL, generates Prisma, deploys migrations, starts the loopback factory, and verifies its first health response.

## Context

The factory already has safe environment setup, Prisma scripts, a loopback-only launcher, and a health endpoint. They currently require a manually ordered command sequence. `factory:doctor` is the diagnostic boundary; generated products and hosted environments remain independent operational boundaries.

## Non-goals

- Installing or configuring production providers.
- Using the dashboard to execute product or host commands.
- Treating local bootstrap success as production-readiness evidence.
- Automatically installing system-wide runtimes or Docker Desktop.

## Risks

- A bootstrap command could leak a database URL or generated auth secret.
- Port 3000 may belong to an unrelated process.
- Starting a database or server without lifecycle ownership could leave orphaned processes.
- Docker and local Prisma database behavior differ across operating systems.
- Later readiness evidence must distinguish automated checks from manual launch gates.

## Milestones

- [x] Add and verify one-command local factory bootstrap.
- [x] Complete doctor checks for database connectivity, migrations, artifacts, and occupied ports.
- [x] Add database-backed billing and auth lifecycle integration tests.
- [x] Link G0-G8 to dated evidence and remove parallel status ambiguity.
- [x] Add Windows and macOS setup smoke jobs.
- [x] Add a read-only dashboard blueprint composer that exports configuration or a CLI command.
- [ ] Continuously verify lean and full standalone reference products with sandbox journeys.
- [x] Add accessibility and performance gates plus restore, rollback, and alert-ownership evidence requirements.

## Acceptance

- From a supported clean clone, `npm run factory:bootstrap` performs install, safe setup, Prisma generation, local database readiness, migration deployment, loopback startup, and a successful `/api/health` verification.
- Focused orchestration tests cover command ordering, database fallback, occupied-port refusal, and sanitized failures.
- Each later milestone records its narrow tests and applicable repository gates before completion.
- No milestone changes the dashboard into a command-execution surface.

## Decisions

- 2026-09-03: Keep bootstrap in a dependency-free Node module so `npm run factory:bootstrap` works before `pnpm install`.
- 2026-09-03: Prefer the configured database, start Docker Compose when available, and otherwise use Prisma's local development database without printing its credential-bearing URL.
- 2026-09-03: Verify the server through the bounded health contract rather than accepting any listener on port 3000.

## Progress

- [x] 2026-09-03: Reviewed setup, doctor, launcher, Prisma configuration, and health boundaries.
- [x] 2026-09-03: Added `npm run factory:bootstrap` with exact Node and pnpm enforcement, frozen installation, idempotent environment setup, Prisma generation, configured database reuse, Docker/Prisma local fallback, migrations, loopback startup, occupied-port refusal, and owned health verification.
- [x] 2026-09-03: Eight focused orchestration tests passed, including Docker daemon and failed-Compose-to-Prisma fallback orchestration. A supported Node 22 Windows rehearsal completed install, setup, Prisma generation, database reachability, all three deployed migrations, and owned `/api/health` verification; earlier failed wrapper attempts are not readiness evidence.
- [x] 2026-09-03: Expanded `factory:doctor` with PostgreSQL URL validation, credential-safe endpoint reachability, Prisma migration status, generated-client verification, and port 3000 ownership through the factory health contract. Nine focused tests, strict TypeScript, formatting, and the live doctor passed; the live report confirmed all migrations applied and the running factory owned port 3000.
- [x] 2026-09-03: Added an explicit `pnpm test:integration` boundary backed by migrated PostgreSQL locally and in CI. Better Auth coverage proves signup persistence, automatic owner-workspace provisioning, session lookup, signout revocation, and session deletion. Billing coverage proves persisted webhook completion, duplicate suppression, changed-payload rejection, failed-attempt recording, atomic retry attempt increments, and stale-event suppression. Four database integration tests pass, and explicit integration mode fails when `DATABASE_URL` is absent. Stripe network calls remain mocked; provider sandbox journeys belong to the reference-product milestone.
- [x] 2026-09-03: Made `docs/production-readiness.md` the canonical G0-G8 status, linked every gate item to a dated evidence audit, and classified incomplete items as partial or blocked without promoting roadmap claims. The roadmap now explicitly tracks implementation progress only. The audit records the exact automated tests, validation records, policies, external dependencies, and next evidence needed for every gate.
- [x] 2026-09-03: Added least-privilege `windows-latest` and `macos-latest` setup smoke jobs. Each installs the pinned toolchain, runs the focused setup/bootstrap tests, invokes the real setup command on a clean checkout, validates generated local URLs, PostgreSQL configuration, operator mode, and a non-placeholder auth secret without printing it, then reruns setup to prove byte-for-byte idempotence. Nine focused tests and a disposable-root Windows smoke passed locally; hosted macOS output remains required before closing the G0 operating-system readiness item.
- [x] 2026-09-03: Added an always-available, client-only dashboard blueprint composer backed by the generator's shared browser-safe schema. It validates product identity and outcome fields, enforces standalone output, resolves auth dependencies and package closure, downloads versioned JSON, and copies a base64url-encoded CLI command without adding any HTTP execution surface. Encoded CLI input rejects malformed, noncanonical, and mixed-option payloads. Twelve focused CLI/generator tests, four composer tests, 19 factory tests, both strict typechecks, factory lint, and the production build passed. Authenticated desktop and Pixel 7 browser checks confirmed dependency locking, safe output, and no page, composer, or control overflow; the repository Playwright binary download was blocked locally by TLS interception.
- [ ] 2026-09-03: Added lean and full standalone reference profiles plus a pull-request and main-branch CI matrix. Generation is forced outside the factory, does not mutate the registry, rejects linked output, validates profile modules and database ownership, resolves an independent lockfile, proves a frozen reinstall, and runs each product's setup, doctor, engineering gate, build, and local-adapter browser journeys. Three focused generation tests and the forge CLI typecheck passed. A disposable lean product passed install, frozen reinstall, setup, doctor, format, lint, typecheck, tests, license policy, and build. A disposable full product passed the same gate plus Prisma validation, generation, migration deployment, and database-backed tests against an isolated PostgreSQL schema. Local Prisma bootstrap required a process-scoped TLS workaround because the host intercepts the engine download; no workaround was committed. Keep this milestone open until the hosted matrix passes and real provider sandbox journeys are recorded; missing provider credentials remain doctor warnings, not sandbox passes.
- [x] 2026-09-03: Added WCAG 2.1 A/AA axe scans and keyboard assertions to the factory and generated-product Playwright journeys. Added a 20-request concurrent health profile that enforces successful responses, a 2 KiB response limit, and a one-second p95 budget while printing measured evidence to CI. Generated production deployment now runs a dependency-free, fail-closed `launch:check` before migrations or deployment; it requires fresh quality, security, accessibility, performance, isolated restore, rollback, and six-class alert-routing evidence tied to the exact release. The blocked example cannot pass accidentally or contain placeholders. Twelve focused launch/generator tests, three reference generation tests, factory lint, and both relevant typechecks passed. Local Playwright execution remains blocked by the missing browser download, so hosted browser output and real restore, rollback, provider-outage, and alert-routing exercises remain open canonical readiness evidence.
- [x] 2026-09-03: Final local PR verification passed formatting, all workspace lint and strict type checks, 58 forge CLI tests, 19 factory tests, 14 billing tests, three auth tests, all capability-package tests, four PostgreSQL integration tests, the 15-expression license policy, and the production build. The Playwright health profile passed on desktop and mobile at p95 186 ms and 150 ms; four browser journeys remain unrun because the intercepted local host lacks the Chromium binary. Hosted browser, operating-system matrix, provider sandbox, restore, rollback, outage, alert-routing, provenance, and SBOM evidence remain required before production readiness can be claimed.

## Recovery

Resume from the first unchecked milestone and current `git diff`. Bootstrap-created `.env.local`, generated Prisma output, local database state, and development processes are ignored/runtime artifacts. Reverse source changes normally; never delete an existing user environment or database as rollback.
