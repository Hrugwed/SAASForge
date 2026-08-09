# SaaS product template boundary

This folder defines the ownership boundary for a product created by SaaSForge.

The private factory owns reusable source packages, launch playbooks, and templates. A generated product owns its brand, customer workflow, domain, database, provider credentials, pricing, legal copy, and deployment.

Create a product through `pnpm forge:create`; do not copy the folders manually. The generator combines `base/` with only the selected overlays under `modules/`, validates the product identity, refuses overwrites, rolls back partial output, and records a successful product in the factory registry.

The template is intentionally headless: shared packages provide behavior and contracts, while each product owns its information architecture, visual system, copy, and core workflow. Enable only the modules that serve the validated idea. Never put product Stripe keys, database URLs, or production data in the SaaSForge factory.
