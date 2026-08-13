# Contributing to SaaSForge

Start with `AGENTS.md`, `docs/vision.md`, and the relevant package or template instructions. Open an issue before a broad architectural or provider change.

## Development

1. Use Node from `.nvmrc` and the pnpm version in `package.json`.
2. Run `pnpm install`, `pnpm factory:setup`, and `pnpm factory:doctor`.
3. Keep generated products disposable and out of Git.
4. Add tests at the changed security or capability boundary.
5. Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm license:check`, and `pnpm build`.

Pull requests should explain the customer or operator outcome, security implications, migration/rollback behavior, verification evidence, and documentation changes. Never commit credentials, personal paths, provider payload fixtures containing real data, or generated product output.

By contributing, you agree that your contribution is licensed under this repository's MIT License.
