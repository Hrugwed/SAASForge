# Architecture

## Product model

SaaSForge is a private control center. Each SaaS product generated from it is independently deployable and owns its production data, secrets, domains, billing configuration, and email reputation. Products reuse source-controlled packages for standardized behavior; SaaSForge itself is never sold, priced, or connected to customer billing.

## Initial technology decisions

| Concern        | Decision                                                   |
| -------------- | ---------------------------------------------------------- |
| Application    | Next.js App Router with strict TypeScript                  |
| Repository     | pnpm workspace with Turborepo                              |
| UI             | Tailwind CSS and accessible source-owned components        |
| Database       | Neon PostgreSQL through Prisma and a shared data package   |
| Authentication | Better Auth with database sessions and organization roles  |
| Billing        | Stripe behind internal subscriptions and entitlements      |
| Deployment     | Independent Vercel project per application                 |
| Quality        | ESLint, TypeScript, Vitest, Playwright, CI security checks |

The factory recommends Resend for transactional email, PostHog for product analytics, Sentry for error monitoring, and Vercel for application deployment. Those services are attached through product-owned adapters and credentials; the shared source packages remain provider-testable and avoid coupling product features to vendor payloads.

## Dependency direction

```text
product application
  -> product services
    -> shared packages
      -> external providers
```

External provider objects stop at adapter boundaries. Product code consumes normalized internal types.

`pnpm forge:create` composes a product from the headless base template plus selected module overlays. It validates the blueprint, prevents path traversal and overwrites, removes partial output on failure, and records successful products in the private factory registry. Generated products can live in this monorepo for speed while retaining separate runtime boundaries; they can be extracted into their own repositories later without redesigning their application code.

Stripe Price IDs are mapped from internal plan keys in server configuration; the browser cannot choose an arbitrary amount or Price. Signed webhook events are deduplicated in PostgreSQL, then the current subscription is fetched from Stripe before the internal subscription and entitlement records are updated. Unknown prices and uncertain states grant no access.

The factory and every product are separate operational boundaries. The factory controls source packages, templates, playbooks, and private planning. A product receives its own environment file, Stripe account configuration, database, deployment, legal copy, and customer-facing application routes.

Authentication is verified in server-side data access functions and again near sensitive reads or mutations. Route proxies may improve navigation but are never the only authorization control. Every tenant-owned table carries an `organizationId`, and every query must scope by both the authenticated user membership and organization.

## Environments

Every product has isolated local, preview, staging, and production configuration. Production credentials are never made available to preview builds.

## Upgrade strategy

Shared capabilities live in packages with explicit public APIs. Pull requests run tests for every affected application. Automated dependency updates are reviewed and merged continuously instead of accumulated into large upgrades.
