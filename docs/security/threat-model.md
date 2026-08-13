# SaaSForge threat model

## Assets

Identity and session data, tenant data, billing state, entitlements, provider credentials, uploaded objects, email content, analytics identifiers, audit evidence, source/release integrity, and AI-tool permissions.

## Trust boundaries

- Browser to application server.
- Application server to database and storage.
- Application server to external providers.
- Provider webhook to application server.
- Queue/scheduler to background worker.
- Factory CLI to filesystem and Git repository.
- CI runner to source, secrets, registries, and deployment targets.
- Coding agent instructions/tools to repository, shell, browser, connectors, and external actions.

## Primary threats and controls

| Threat                              | Required controls                                                                                                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cross-tenant data access            | server-derived organization, scoped queries, explicit role policy, negative isolation tests                                                                      |
| Session/account takeover            | secure cookies, rotation/revocation, verification/reset controls, rate limits, audit events                                                                      |
| Billing/access manipulation         | server-owned prices, signed/idempotent webhooks, internal entitlements, reconciliation                                                                           |
| Webhook replay or reordering        | raw-body verification, provider event IDs, idempotent transitions, timestamp/replay policy                                                                       |
| Upload abuse or data exposure       | private default, content/size validation, signed short-lived access, malware strategy, quotas                                                                    |
| Job duplication or confused tenancy | immutable tenant context, idempotency keys, retry bounds, dead-letter review                                                                                     |
| Secret exposure                     | validated environment, redaction, scoped CI secrets, no secrets in client/generation/logs                                                                        |
| Generator path or template attack   | schema validation, canonical path containment, no replacement, rollback manifest, template trust                                                                 |
| Supply-chain compromise             | lockfile, update review, minimal CI permissions, scanning, provenance and SBOM evidence                                                                          |
| AI prompt/instruction attack        | treat repository/external text as untrusted data, least-privilege tools, approvals for external/destructive actions, deterministic hooks/CI for mandatory checks |
| Cost amplification                  | authentication, quotas, request limits, job budgets, provider timeouts, usage telemetry                                                                          |

## Review triggers

Update this model when adding a provider, privileged role, public upload/URL fetch, AI execution, webhook, background job, export/delete path, deployment target, or generator capability.

This is an engineering threat model, not a certification or compliance claim.
