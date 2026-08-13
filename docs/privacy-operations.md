# Privacy and support operations

Every product must replace placeholder legal text with advice appropriate to its market. SaaSForge supplies technical controls, not a compliance certification.

## Export and deletion

Authenticated users can export their profile, workspace memberships, normalized subscription state, entitlements, and their own audit actions from `/api/account/export`. Secrets, OAuth tokens, password hashes, provider payment data, other members' email addresses, and message contents are excluded.

Better Auth's verified account-deletion flow deletes identity, sessions, accounts, and memberships. Users should export first, transfer or delete owned workspaces, then request account deletion. Product code must explicitly implement deletion of its own database rows, private objects, provider resources, and queued jobs. Define retention exceptions for billing records, fraud/security evidence, backups, legal holds, and statutory obligations. Document when each retained copy expires and how restore systems preserve deletions.

## Support access

The support diagnostic endpoint is disabled unless `SUPPORT_USER_IDS` contains an authenticated user ID. It returns workspace metadata, member count, and normalized billing health—not member identities, tokens, content, or payment details—and every successful view creates an audit event. Keep the allowlist minimal, review it regularly, require MFA at the identity provider when OAuth is enabled, and remove access immediately when no longer needed.

Do not add impersonation or arbitrary database mutation as a convenience. Product-specific support actions require narrow authorization, explicit reason/ticket fields, audit trails, customer-visible consequences, and tests.

## Required product decisions

- Data inventory, purpose, legal basis, subprocessors, region, retention, and deletion owner.
- Export contents and machine-readable format.
- Workspace ownership transfer and deletion semantics.
- Backup deletion propagation and restore reconciliation.
- Provider cleanup for Stripe, Resend, PostHog, Inngest, Sentry, and R2.
- Support access approval, review cadence, and incident escalation.
