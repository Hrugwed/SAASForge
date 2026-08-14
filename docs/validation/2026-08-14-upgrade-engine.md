# Factory 0.2 upgrade-engine validation

Date: 2026-08-14

## Automated evidence

The Forge CLI upgrade suite covers dry-run and apply behavior, three-way preservation and conflicts, additions and removals, untracked collisions, rollback before and after mutations, update and removal restoration, no-op idempotence, downgrade prevention, disjoint roots, secret-like manifest paths, internal and escaping symlinks, and hard links.

Focused validation passed with 26 Vitest tests plus strict TypeScript and formatting checks.

## Standalone CLI rehearsal

A disposable analytics product was generated, moved outside the factory tree, and prepared as a coherent simulated 0.1 baseline. It contained:

- one unchanged old factory-managed upgrade guide;
- one customized managed application file;
- one deleted managed incident runbook;
- one unmanaged product notes file.

`pnpm forge:upgrade -- --product <proof-path>` reported one update, two preserved product changes, zero conflicts, and made no writes. The old manifest and file bytes remained in place.

`pnpm forge:upgrade -- --product <proof-path> --apply` changed only the factory-owned guide, advanced the manifest from 0.1.0 to 0.2.0, and preserved the customized, deleted, and unmanaged product files. `product:changes` then reported exactly one customization and one deletion.

A second `--apply` reported zero mutations and left the product already up to date, proving idempotence. The disposable repository was removed after evidence collection.

## Review findings closed

The Sol integration review and an independent Terra adversarial review found and closed overlapping deletion/removal conflicts, manifest rollback gaps, internal symlink redirection, hard-link aliasing, over-broad rollback deletion, stale plan revalidation, pre-write manifest races, no-op manifest rewrites, unknown CLI options, and downgrade behavior before this milestone was accepted.
