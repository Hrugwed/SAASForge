# Backup and restore runbook

## Policy

Enable Neon point-in-time restore appropriate to the product's recovery objectives. Document the expected recovery point objective (maximum data loss) and recovery time objective (maximum recovery duration) before launch.

## Restore drill

1. Record the UTC start time, source branch, target restore point, operator, and expected data checks.
2. Restore into a new isolated Neon branch. Never overwrite production for a drill.
3. connect a temporary Preview deployment to the restored branch.
4. Run schema validation, row-count/invariant checks, and the primary browser journey without sending real email or billing events.
5. Record recovery point, elapsed time, verification evidence, and any gaps.
6. Delete the temporary deployment and branch only after evidence is retained.

Run a drill before launch and on a regular schedule based on business risk. A configured backup is not considered proven until a restore succeeds.
