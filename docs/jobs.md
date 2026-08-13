# Durable jobs

Generated products use Inngest for background and scheduled work. Every product owns its Inngest application and credentials. Events carry a stable event ID, organization ID, optional actor ID, bounded JSON data, and occurrence time.

The generated example shows the required operating pattern:

- Validate the event again inside the function and re-fetch tenant-owned resources before side effects.
- Use the event ID for function idempotency and product-owned keys for downstream API idempotency.
- Limit concurrency per organization so one tenant cannot exhaust shared capacity.
- Put each external side effect in a stable `step.run` checkpoint.
- Bound retries and use `onFailure` to create an auditable terminal-failure record.
- Use native cron triggers for recurring work; do not hold a server process open.

The Inngest dashboard is the operational queue and replay surface. Configure alerts for terminal failures and backlog age, document who owns them, and test replay against a non-production environment. A replay must be safe: completed checkpointed steps and idempotent downstream calls must not duplicate customer-visible effects.

Replace the example task body with the product's core operation but retain its tenancy, idempotency, concurrency, retry, and failure-handling controls. Delete example triggers that the product does not use.
