# SaaSForge agent guide

## Mission

SaaSForge is an AI-native factory for generating independent, production-oriented SaaS products. The factory owns reusable capabilities and verification. A generated product owns its business logic, brand, data, secrets, providers, domain, and deployment.

## Read only what the task needs

1. Read this file once.
2. Read the closest nested `AGENTS.md` for files you touch.
3. Route architecture questions through `docs/context-map.md`; do not scan the repository blindly.
4. For multi-hour or cross-package work, follow `PLANS.md` and maintain an execution plan under `docs/plans/active/`.
5. Use the matching workflow in `.agents/skills/` instead of recreating a checklist in chat.

## Non-negotiable engineering rules

- Use strict TypeScript. Validate every external boundary; do not introduce `any`.
- Authenticate and authorize on the server. Never trust client identity, roles, prices, quotas, entitlements, redirects, or tenant IDs.
- Scope every tenant-owned read and write by the authenticated organization.
- Verify webhook signatures before parsing trusted data and make processing idempotent.
- Keep secrets out of source, logs, generated products, fixtures, and error responses.
- Every schema change requires a migration, rollback analysis, and tenant-isolation coverage.
- Provider payloads stop at adapters. Product code consumes stable SaaSForge contracts.
- Generated products must have independent data, credentials, billing, domains, and deployments.
- Do not add product-specific models or business logic to the factory core.
- Add tests with behavior changes. Run the narrowest relevant checks, then the repository quality gate.
- Document every new vendor, major dependency, public contract, and irreversible architectural decision.

## Repository boundaries

- `apps/factory`: local control center; never contains a customer's product workflow.
- `packages/*`: reusable capability contracts and implementations.
- `templates/saas-product`: canonical generated-product source.
- `tooling/forge-cli`: deterministic generation, validation, export, and upgrade tooling.
- `products/*`: disposable local outputs; never the source of reusable behavior.
- `docs/`: architecture, decisions, playbooks, operations, plans, and readiness evidence.

## Required verification

Before handoff, report commands actually run and any checks not run. The default full gate is:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Never describe SaaSForge or a generated product as production-ready unless every required gate in `docs/production-readiness.md` has recorded evidence.
