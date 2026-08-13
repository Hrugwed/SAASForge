# Execution plans

Use an execution plan for work that spans packages, changes a public contract, changes security or tenancy behavior, introduces a provider, modifies generation, or is unlikely to finish in one focused session.

## Plan location and lifecycle

- Active: `docs/plans/active/<yyyy-mm-dd>-<slug>.md`
- Completed: `docs/plans/completed/<yyyy-mm-dd>-<slug>.md`
- One plan owns one outcome.
- Update the plan after every meaningful milestone or discovery.
- Move it to `completed/` only after its acceptance evidence is recorded.

## Required sections

Every plan is self-contained and contains:

1. **Outcome** — observable user or operator result.
2. **Context** — relevant boundaries and links, not a repository dump.
3. **Non-goals** — work deliberately excluded.
4. **Risks** — security, tenancy, migration, compatibility, and rollback risks.
5. **Milestones** — ordered, independently verifiable changes.
6. **Acceptance** — commands and behavior that prove completion.
7. **Decisions** — decisions made while executing and why.
8. **Progress** — timestamped checklist that survives context compaction.
9. **Recovery** — how to resume after interruption and how to reverse unsafe changes.

Plans describe intent and evidence. Deterministic commands belong in scripts; stable architecture belongs in `docs/architecture/`; repeated procedures belong in `.agents/skills/`.
