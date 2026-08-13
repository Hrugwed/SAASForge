# Provider strategy

## Rule

SaaSForge ships one recommended provider per capability, a stable internal contract, and an explicit local/test implementation. Additional providers are accepted only when real product demand justifies their maintenance cost.

## Recommended production profile

| Capability          | Default       | Boundary                                                          |
| ------------------- | ------------- | ----------------------------------------------------------------- |
| Application hosting | Vercel        | deployment adapter and documented environment contract            |
| PostgreSQL          | Neon          | standard PostgreSQL connection; Prisma remains provider-neutral   |
| Authentication      | Better Auth   | application-owned identity tables and server authorization policy |
| Billing             | Stripe        | catalog, customer, subscription, event, and entitlement contracts |
| Transactional email | Resend        | message/template contract                                         |
| Product analytics   | PostHog       | validated event contract and consent policy                       |
| Errors and tracing  | Sentry        | sanitized observability contract                                  |
| Jobs and schedules  | Inngest       | job/event contract with idempotency requirements                  |
| Object storage      | Cloudflare R2 | S3-compatible storage contract                                    |

These are defaults, not leaked dependencies. Vendor SDK objects must not cross capability boundaries. Provider setup is opt-in, credentials stay outside Git, and local development must remain possible without paid accounts where practical.

## Adding or replacing a provider

Document the reason, data handled, regions, security assumptions, failure modes, webhook behavior, pricing risk, export path, and exit strategy. Add contract tests shared by all implementations. Do not add a provider only because an agent can generate the integration quickly.
