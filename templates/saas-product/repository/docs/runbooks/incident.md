# Incident response runbook

1. **Detect:** acknowledge the alert and confirm customer impact.
2. **Lead:** assign incident commander, technical lead, and communications owner; one person may hold multiple roles for a small team.
3. **Contain:** revoke exposed credentials, disable the affected feature, or roll back without destroying evidence.
4. **Communicate:** provide timestamped, factual updates; do not guess at causes or resolution times.
5. **Recover:** verify readiness and primary customer journeys before declaring resolution.
6. **Learn:** document timeline, impact, root causes, detection gaps, and owned follow-up actions.

Security incidents also follow `SECURITY.md` and require preserving relevant logs. Never place secrets, access tokens, or unnecessary personal data in incident documents.
