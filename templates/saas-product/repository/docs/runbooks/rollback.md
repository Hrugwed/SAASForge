# Rollback runbook

## Trigger

Rollback when a release causes material errors, security exposure, incorrect billing, data corruption risk, or failure of the primary customer journey.

## Procedure

1. Declare an incident, name an owner, record the UTC start time, and pause further releases.
2. If the schema remains compatible, use Vercel deployment history to promote the last verified production deployment.
3. If data or schema is involved, stop writes to the affected workflow and follow `backup-restore.md`; never blindly reverse a migration.
4. Verify `/api/health`, `/api/ready`, authentication, billing access, and the product's primary journey.
5. Monitor errors and provider dashboards until stable, then communicate resolution.
6. Preserve logs and write a blameless follow-up with corrective actions.

Practice this runbook before launch and at least every six months. Record the deployment IDs, timings, gaps, and owner.
