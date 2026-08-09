# SaaSForge engineering guide

## Purpose

SaaSForge is a reusable platform for launching multiple independent SaaS products. Keep shared concerns in `packages/` and product-specific value in `apps/`.

## Engineering rules

- Use TypeScript in strict mode. Avoid `any`; validate all external data.
- Prefer server components. Add `"use client"` only at an actual client boundary.
- Never trust client-provided identity, prices, roles, quotas, or redirect URLs.
- Perform authentication and authorization checks in server-side operations.
- Verify webhook signatures and make webhook processing idempotent.
- Keep secrets in environment variables. Update `.env.example` when adding one.
- Every database schema change must include a migration.
- Add or update tests for authentication, authorization, billing, and tenant isolation.
- Run `pnpm lint`, `pnpm typecheck`, and relevant tests before handing off work.
- Do not add a new vendor or major dependency without documenting the reason.

## Architecture boundaries

- `apps/factory`: the private SaaSForge control center.
- `templates/saas-product`: product-owned configuration examples and the future generator boundary.
- `packages/ui`: accessible, brandable UI primitives and composed components.
- `packages/config`: validated product and environment configuration.
- Future service packages (`auth`, `billing`, `database`, `email`, `analytics`, `security`, `observability`) expose narrow provider adapters and must not leak vendor payloads into product code.

## Security

- Follow least privilege and deny access by default.
- Do not log credentials, session tokens, payment data, or sensitive personal data.
- Use structured, sanitized errors for clients; retain diagnostic context server-side.
- Fail closed when authorization, entitlement, or signature verification is uncertain.
