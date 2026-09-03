# Deployment

This product owns one Vercel project, one Neon project, its domains, and its credentials. Never point multiple products at the same production database or provider project.

## Environment boundaries

- **Local:** Docker PostgreSQL or a product-owned Neon development branch and `apps/web/.env.local`.
- **Preview:** Vercel creates a deployment for pull-request branches. Connect the Neon Vercel integration so each preview receives an isolated database branch.
- **Production:** `main` does not auto-deploy. The protected **Deploy production** workflow applies migrations once, builds the exact commit, and deploys the prebuilt artifact.

Vercel custom environments require a paid plan. On the Hobby plan, use protected Preview deployments as pre-production. Add a custom `staging` environment only when its cost is justified.

## One-time setup

1. Create a Vercel project from this repository with the repository root as the project root.
2. Create a separate Neon project in the deployment region closest to the application.
3. Install Neon's Vercel integration and enable preview database branches.
4. Configure every value from `apps/web/.env.example` separately in Vercel Preview and Production. Never reuse production credentials in Preview.
5. Create a GitHub environment named `production`. Require approval and restrict it to `main`.
6. Add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, and `DATABASE_URL` as GitHub production-environment secrets. `DATABASE_URL` is the direct production migration connection, not a preview URL.
7. Configure the production domain, provider webhooks, monitoring alerts, and status contact.

Environment changes affect only new Vercel deployments. Trigger a new Preview or production release after rotating a value.

## Release

1. Merge a reviewed pull request only after Quality and Security pass.
2. Verify the Preview deployment and `/api/ready` response.
3. Copy `docs/launch-evidence.example.json` to `docs/launch-evidence.json`, replace every placeholder with dated evidence, and run the launch check for your shell.

   POSIX:

   ```sh
   pnpm launch:check -- --evidence docs/launch-evidence.json --commit "$(git rev-parse HEAD)" --version "$(node -p "require('./package.json').version")"
   ```

   PowerShell:

   ```powershell
   $commit = git rev-parse HEAD
   $version = node -p "require('./package.json').version"
   pnpm launch:check -- --evidence docs/launch-evidence.json --commit $commit --version $version
   ```

4. Run **Deploy production** from GitHub Actions against the `main` commit. The workflow reruns `launch:check` before migrations or deployment.
5. Confirm `/api/health`, `/api/ready`, the primary browser journey, error rate, and provider dashboards.
6. Record the release, migration, operator, and verification links in the change log or release ticket.

Database migrations must be backward-compatible with the currently running application. Use expand/migrate/contract changes: add compatible structures, deploy code that supports both shapes, backfill, then remove old structures in a later release.

## Required launch evidence

- A successful protected production workflow.
- A healthy readiness endpoint and browser smoke journey.
- A Neon backup/restore drill with date and operator.
- Tested rollback and incident runbooks.
- Alert ownership for uptime, errors, latency, billing drift, email failures, and job backlog.

The release and every quality, security, accessibility, performance, restore, and rollback record must identify the exact 40-character commit and package version passed to `launch:check`, use HTTPS evidence links, and remain within the freshness windows enforced by the command. Do not commit credentials, provider payloads, customer data, or private incident details in the record.
