# Context map

Use this index to load only the documentation needed for a task.

| Task                         | Start here                      | Then inspect                                  |
| ---------------------------- | ------------------------------- | --------------------------------------------- |
| Understand the product       | `docs/vision.md`                | `docs/production-readiness.md`                |
| Change system boundaries     | `docs/architecture.md`          | `docs/decisions/` and affected package        |
| Change the factory dashboard | `docs/control-plane.md`         | `apps/factory` and `tooling/forge-cli`        |
| Generate or export a product | `docs/product-generator.md`     | `tooling/forge-cli`, `templates/saas-product` |
| Change identity or tenancy   | `docs/database-auth.md`         | `packages/auth`, `packages/database`          |
| Change payments or access    | `docs/billing.md`               | `packages/billing`, webhook tests             |
| Add a provider               | `docs/providers/strategy.md`    | capability adapter and configuration schema   |
| Prepare a launch             | `docs/production-readiness.md`  | `.agents/skills/release-product/`             |
| Perform a security review    | `docs/security/threat-model.md` | `.agents/skills/security-review/`             |
| Run long work                | `PLANS.md`                      | `docs/plans/active/`                          |

If a required document does not exist, create the smallest authoritative document in the routed location rather than adding unrelated material to `AGENTS.md`.
