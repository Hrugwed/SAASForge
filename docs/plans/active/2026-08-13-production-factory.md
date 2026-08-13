# Complete the production SaaS factory

## Outcome

A clean public SaaSForge clone can generate, verify, export, deploy, operate, upgrade, and recover independent SaaS products through documented and tested workflows.

## Context

Start with `docs/vision.md`, `docs/production-readiness.md`, and `docs/context-map.md`. SignalDesk has been removed because validation products must be disposable evidence, not part of the factory architecture.

## Non-goals

- Building any product-specific customer workflow.
- Supporting every provider or cloud.
- Claiming legal or regulatory compliance through code alone.
- Hiding operational responsibility from the product owner.

## Risks

- Shared schemas or secrets could silently couple products.
- A broad module catalog could create unmaintainable shallow integrations.
- Generated code and factory packages could drift without versioned manifests and upgrade tests.
- AI instructions could consume more context if routing and skills are not kept concise.

## Milestones

- [x] Remove SignalDesk and its shared-schema residue.
- [x] Define product vision, context routing, provider policy, and measurable readiness gates.
- [ ] Rebuild generator around product manifests, schema ownership, standalone export, and upgrades. Standalone generation is proven; upgrade workflow remains.
- [ ] Complete production capability contracts and recommended implementations.
- [ ] Add setup/doctor, deployment, operations, recovery, and release automation.
- [ ] Add security, accessibility, performance, supply-chain, and compatibility gates.
- [ ] Add public-repository governance and documentation.
- [ ] Generate two disposable validation products and record complete evidence.

## Acceptance

All applicable items in `docs/production-readiness.md` are checked with evidence. A clean-clone rehearsal and a restore drill succeed. Two generated products with different module profiles remain isolated and pass the full quality pipeline.

## Decisions

- 2026-08-13: Keep `AGENTS.md` concise and route detailed procedures to skills and docs.
- 2026-08-13: Maintain one recommended provider profile behind stable contracts.
- 2026-08-13: Treat generated products as disposable until the factory itself is ready.

## Progress

- 2026-08-13: Repository audited; SignalDesk source, local output, registry record, migration, and product-specific shared models removed.
- 2026-08-13: Phase-zero product and readiness standards created.
- 2026-08-13: Generator changed from a factory-workspace app to a self-contained repository with selected package closure, owned schema/migrations, root tooling, agent instructions, and a versioned manifest.
- 2026-08-13: Disposable all-capability repository passed install, Prisma generation, formatting, lint, strict types, unit tests, and production build; output was then removed.
- 2026-08-13: Added non-destructive factory and generated-product setup/doctor workflows with secret-safe diagnostics.

## Recovery

Resume from the first incomplete milestone, inspect `git status`, read the latest progress entry, and run the narrow verification for the last changed boundary. Revert incomplete generation through its manifest/rollback mechanism; never delete broad workspace paths.
