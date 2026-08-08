# SaaSForge

SaaSForge is a secure, maintainable foundation for repeatedly launching SaaS products without rebuilding authentication, billing, email, analytics, design, and operations each time.

## Status

The repository is in Foundation Phase. The first deliverable is a production-quality starter application plus upgradeable shared packages.

## Structure

```text
apps/
  starter/          Reference SaaS application
packages/
  auth/             Better Auth configuration and authorization policy
  config/           Validated product configuration
  database/         Prisma schema, migrations, and PostgreSQL client
  ui/               Shared design system
docs/
  architecture.md   Architecture decisions and boundaries
  database-auth.md  Local and production identity/data setup
  roadmap.md        Phased implementation plan
```

## Commands

```bash
pnpm install
docker compose up -d
pnpm db:migrate
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

The starter contains the application shell, design system, validated product configuration, PostgreSQL/Prisma data layer, Better Auth identity, organization tenancy, security headers, SEO routes, health endpoint, and automated quality pipeline. Billing is the next factory module.

## Principles

1. Secure defaults over optional hardening.
2. A modular monolith over premature distributed systems.
3. Provider adapters over provider payloads in product code.
4. Independent product data and secrets over shared production blast radius.
5. Automated verification over undocumented confidence.
