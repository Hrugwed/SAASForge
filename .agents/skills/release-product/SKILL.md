---
name: release-product
description: Prepare a generated SaaSForge product or factory version for release using evidence-based launch gates, migration safety, rollback, and operational ownership.
---

# Release a product

1. Confirm the release scope and immutable version.
2. Read `docs/production-readiness.md`, applicable runbooks, changelog, and active execution plan.
3. Require a clean working tree or explicitly documented release contents.
4. Run the complete quality, security, accessibility, and build gates in the release environment.
5. Validate environment separation, production-safe configuration, provider webhooks, domains, sender identity, catalog, and alert routing.
6. Review migrations for expand/contract safety, execution ordering, time/lock risk, backup, and recovery.
7. Verify health/readiness endpoints, smoke journey, monitoring, support contact, rollback command, and incident owner.
8. Produce a release record containing version, commit, migrations, configuration changes, evidence links, known risks, and rollback trigger.
9. Do not release when a required readiness gate lacks evidence. Record the blocker rather than weakening the gate.
