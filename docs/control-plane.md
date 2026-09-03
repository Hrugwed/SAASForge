# Factory control plane

The private dashboard is the operator interface for a local SaaSForge clone. It is not a marketing mockup, a customer admin panel, or a shared runtime for generated products.

## What v1 reads

On every authenticated request, the server reads the bounded factory registry and reconciles each valid entry with `products/<slug>/saasforge.manifest.json`. It reports:

- validated product identity and selected capabilities;
- whether the registered directory and expected operational artifacts exist;
- the factory version recorded at generation time compared with the current factory;
- the count of managed files without returning their fingerprints;
- bounded registry, manifest, identity, and artifact issues.

The registry is dynamically read rather than statically imported, so a successfully generated product appears on a fresh request without rebuilding the factory application.

## What v1 never reads or executes

The control plane does not return absolute host paths, environment values, secrets, managed-file hashes, customer data, or raw provider payloads. It does not execute product code, migrations, deployment, setup, doctor, or upgrade commands through HTTP. Operator commands are derived from a validated slug, shown only after manifest and artifact verification, and are copy-only.

The product blueprint composer is also read-only. It validates drafts in the browser against the generator's shared schema, resolves capability dependencies, previews the standalone package closure, and exports JSON or a shell-safe encoded CLI command. It has no server action, route handler, registry mutation, filesystem access, or command-execution path.

Manifest agreement proves product provenance and expected structure. It is not runtime health, deployment evidence, provider connectivity, compliance, or production approval.

## Access policy

Local loopback use requires `SAASFORGE_LOCAL_OPERATOR_MODE=enabled`, the loopback-bound factory launcher, a loopback `NEXT_PUBLIC_APP_URL`, a loopback request host, and an authenticated workspace owner or administrator. `pnpm setup` writes the explicit local-mode switch only to the ignored local environment file. The standard `dev` and `start` scripts bind to `127.0.0.1` and inject the verified network scope; callers cannot override their hostname. A hosted factory must use `dev:network` or `start:hosted`, leave local mode disabled, and set `SAASFORGE_OPERATOR_ORGANIZATION_ID`; the server then authorizes the signed-in user against that exact organization and role. Hosted access without a valid policy fails closed.

The registry is factory-global rather than tenant-owned. It must never be authorized through a caller-provided organization ID or an arbitrary first membership.

## Product-owned signals

The product detail page reserves truthful boundaries for PostHog analytics, Stripe revenue, Sentry errors, and Vercel deployment state. In v1, manifest-verified products report them as `product-owned` or `not-selected`; unresolved registry claims report `unverified`. A future connection must use a narrow, read-only provider adapter, product-specific credentials, explicit authorization, bounded responses, and no cross-product secret sharing.

## Status language

- `tracked`: registry identity, manifest, current factory version, and expected artifacts agree.
- `review required`: the manifest is valid but its factory version is ahead of or behind the current factory.
- `attention`: path, manifest, identity, or artifact evidence is missing or unsafe.

These states deliberately avoid `healthy`, `deployed`, and `production-ready`.
