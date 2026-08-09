# Database and authentication

This module is the reusable identity and data foundation for every SaaSForge product. Production products get separate Neon projects, Better Auth secrets, domains, and migrations. They share source code, never production data.

## Local setup

The checked-in example contains no production credentials. Create the local app environment, start PostgreSQL, and apply migrations:

```powershell
Copy-Item .env.example apps/factory/.env.local
docker compose up -d
pnpm db:migrate
pnpm dev
```

The local PostgreSQL port binds only to `127.0.0.1`. Its public development password must never be reused outside the local machine.

Useful commands:

```powershell
pnpm db:validate
pnpm db:generate
pnpm db:migrate
pnpm db:deploy
pnpm db:studio
```

Use `db:migrate` while developing a new schema migration. Use `db:deploy` in CI and production; it applies checked-in migrations without attempting to redesign the schema.

## Production standard

- Create one Neon PostgreSQL project per SaaS product and environment boundary.
- Put `DATABASE_URL`, `BETTER_AUTH_URL`, and a generated `BETTER_AUTH_SECRET` in the deployment platform's encrypted environment settings.
- Never expose those values through `NEXT_PUBLIC_*` variables.
- Run `pnpm db:deploy` as a controlled release step before the application starts serving the new code.
- Enable provider backups and retention, document the recovery point and recovery time objectives, and perform a restore drill before accepting paying customers.
- Never connect preview deployments to the production database.

## Security model

Better Auth stores opaque, HttpOnly sessions and distributed rate-limit counters in PostgreSQL. The factory enables origin checks, explicit trusted origins, secure cookies on HTTPS, tighter sign-in/sign-up limits, a 12-character password minimum, and automatic personal workspace creation with the `owner` role.

Email verification is deliberately not claimed as complete until the transactional email module exists. Before a production launch, connect the email adapter, require verification, and enable password-reset delivery.

Authorization is separate from authentication:

1. Read the session on the server.
2. Load membership using both `userId` and `organizationId`.
3. Check the role or permission next to the protected operation.
4. Scope every tenant query by `organizationId`.
5. Add a test proving a user from organization A cannot access organization B.

Do not trust an organization ID, role, price, entitlement, or user ID sent by the browser.

## Schema upgrades

Better Auth owns the `User`, `Session`, `Account`, `Verification`, `RateLimit`, `Organization`, `Member`, and `Invitation` model contract. When upgrading Better Auth:

1. Generate its schema for the target version to a temporary file.
2. Compare the generated models with `packages/database/prisma/schema.prisma`.
3. Add an explicit Prisma migration.
4. Run type, unit, and end-to-end tests before deployment.

Business access in a generated product uses internal `Subscription` and `Entitlement` records rather than reading Stripe payloads throughout the product. `ProcessedWebhook` reserves an idempotency boundary for the billing phase, and `AuditEvent` stores security-relevant actions without retaining raw provider payloads. The private factory keeps its own local database and is not connected to a product's production data or Stripe account.
