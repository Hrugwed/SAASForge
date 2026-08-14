# Release process

SaaSForge releases version the factory, templates, capability contracts, generator behavior, and AI instructions together.

1. Start from a clean `main` and update `CHANGELOG.md`.
2. Run the full quality and security workflows plus both disposable product profiles.
3. Confirm the manifest/template compatibility decision, run a dry-run and apply upgrade rehearsal against a disposable product, and document breaking upgrade behavior.
4. Create a signed `vX.Y.Z` tag matching `package.json`.
5. Publish GitHub release notes with migration, rollback, provider, and security changes.
6. Verify the tag and source archive, then rehearse a clean clone from the tag.

Do not release when high-severity audit or scanning findings are open, a required readiness gate lacks evidence, migrations lack recovery instructions, or generated products cannot reproduce the release checks.
