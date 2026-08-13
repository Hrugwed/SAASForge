---
name: create-product
description: Generate or export a new SaaSForge product from a validated product brief and capability profile. Use when creating a product, changing its generated manifest, or proving generator isolation.
---

# Create a product

## Inputs

Require a product name, slug, one-sentence customer outcome, deployment mode (`workspace` or `standalone`), and selected capabilities. If only visual details are missing, generate a neutral accessible shell; do not block foundation work.

## Procedure

1. Read `docs/product-generator.md`, `docs/production-readiness.md` G1, and `tooling/forge-cli/AGENTS.md` if present.
2. Validate that the slug is lowercase kebab-case, the destination remains inside the allowed root, and no target will be replaced.
3. Resolve capability dependencies before writing. Billing requires auth; tenant-owned capabilities require organizations.
4. Generate from templates through the CLI. Never copy an existing product.
5. Confirm the product manifest records factory version, template version, capabilities, generation time, and owned schema path.
6. Confirm no production credential, personal path, factory registry state, or unrelated product code entered the output.
7. Run generated-product install, configuration validation, typecheck, tests, and build.
8. For standalone mode, verify the exported repository without workspace-only imports.
9. Report the output path, capabilities, verification evidence, and remaining product-owned decisions.

## Stop conditions

Stop before writing if the target exists, input escapes an allowed root, a dependency is unresolved, or generation would require sharing production data or credentials.
