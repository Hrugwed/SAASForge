# Architecture

## Product model

Each SaaS product is independently deployable and owns its production data, secrets, domains, billing configuration, and email reputation. Products reuse source-controlled packages for standardized behavior.

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

## Dependency direction

```text
product application
  -> product services
    -> shared packages
      -> external providers
```

External provider objects stop at adapter boundaries. Product code consumes normalized internal types.

Authentication is verified in server-side data access functions and again near sensitive reads or mutations. Route proxies may improve navigation but are never the only authorization control. Every tenant-owned table carries an `organizationId`, and every query must scope by both the authenticated user membership and organization.

## Environments

Every product has isolated local, preview, staging, and production configuration. Production credentials are never made available to preview builds.

## Upgrade strategy

Shared capabilities live in packages with explicit public APIs. Pull requests run tests for every affected application. Automated dependency updates are reviewed and merged continuously instead of accumulated into large upgrades.
