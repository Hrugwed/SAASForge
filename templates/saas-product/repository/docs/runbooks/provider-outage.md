# Provider outage runbook

1. Confirm the failure from application telemetry and the provider's official status page.
2. Identify whether the impact is total, regional, or limited to one capability.
3. Fail closed for authentication, authorization, billing grants, and private data access. Queue retry-safe email and job work instead of silently dropping it.
4. Disable only the affected customer action when possible and show a truthful retry message.
5. Do not switch production data to an untested provider during an incident.
6. Monitor recovery, replay idempotent work, reconcile billing and delivery state, and communicate resolution.

Record the provider, incident URL, affected operations, queued/replayed work, and reconciliation results.
