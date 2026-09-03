import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporaryDirectories: string[] = [];
const repositoryRoot = path.resolve(import.meta.dirname, "../../..");
const validator = path.join(
  repositoryRoot,
  "templates",
  "saas-product",
  "repository",
  "scripts",
  "launch-readiness.mjs",
);

function gate(now: string) {
  return {
    status: "passed",
    commit: "0123456789abcdef0123456789abcdef01234567",
    version: "1.0.0",
    completedAt: now,
    evidenceUrl: "https://evidence.invalid/run/123",
  };
}

function completeEvidence() {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    release: {
      version: "1.0.0",
      commit: "0123456789abcdef0123456789abcdef01234567",
      owner: "platform-on-call",
      reviewedAt: now,
      evidenceUrl: "https://evidence.invalid/release/123",
    },
    automated: {
      quality: gate(now),
      security: gate(now),
      accessibility: {
        ...gate(now),
        standard: "WCAG 2.1 AA",
        seriousOrCriticalViolations: 0,
        keyboardJourney: true,
      },
      performance: {
        ...gate(now),
        concurrentRequests: 20,
        p95Milliseconds: 125,
        budgetP95Milliseconds: 1_000,
      },
    },
    restore: {
      ...gate(now),
      operator: "database-on-call",
      isolatedTarget: "neon-restore-branch-123",
      rpoMinutes: 5,
      rtoMinutes: 30,
      actualRecoveryMinutes: 12,
    },
    rollback: {
      ...gate(now),
      operator: "release-on-call",
      fromDeployment: "deployment-broken-123",
      toDeployment: "deployment-stable-122",
      durationMinutes: 8,
    },
    alerts: [
      "uptime",
      "errors",
      "latency",
      "billing-drift",
      "email-failures",
      "job-backlog",
    ].map((signal) => ({
      signal,
      owner: `${signal}-on-call`,
      route: `pager-${signal}`,
      testedAt: now,
      evidenceUrl: `https://evidence.invalid/alerts/${signal}`,
    })),
  };
}

async function validate(evidence: object) {
  const directory = await mkdtemp(path.join(tmpdir(), "launch-evidence-"));
  temporaryDirectories.push(directory);
  const evidencePath = path.join(directory, "evidence.json");
  await writeFile(evidencePath, JSON.stringify(evidence), "utf8");
  return spawnSync(
    process.execPath,
    [
      validator,
      "--evidence",
      evidencePath,
      "--commit",
      "0123456789abcdef0123456789abcdef01234567",
      "--version",
      "1.0.0",
    ],
    { encoding: "utf8" },
  );
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("launch readiness evidence", () => {
  it("accepts complete, current, release-specific evidence", async () => {
    const result = await validate(completeEvidence());

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("[PASS] Launch evidence is complete");
  });

  it("rejects missing alert ownership and an exceeded performance budget", async () => {
    const evidence = completeEvidence();
    evidence.alerts.pop();
    evidence.automated.performance.p95Milliseconds = 1_001;

    const result = await validate(evidence);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("p95Milliseconds exceeds its budget");
    expect(result.stderr).toContain("alerts is missing job-backlog");
  });

  it("rejects stale drills and placeholder evidence links", async () => {
    const evidence = completeEvidence();
    evidence.restore.completedAt = "2020-01-01T00:00:00.000Z";
    evidence.rollback.evidenceUrl = "https://example.com/replace-me";

    const result = await validate(evidence);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("restore.completedAt");
    expect(result.stderr).toContain("rollback.evidenceUrl");
  });

  it("rejects evidence for another release or a weakened performance budget", async () => {
    const evidence = completeEvidence();
    evidence.release.commit = "abcdef0123456789abcdef0123456789abcdef01";
    evidence.release.version = "2.0.0";
    evidence.automated.quality.commit =
      "abcdef0123456789abcdef0123456789abcdef01";
    evidence.automated.security.version = "2.0.0";
    evidence.automated.performance.budgetP95Milliseconds = 60_000;

    const result = await validate(evidence);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("release.version must match");
    expect(result.stderr).toContain("release.commit must match");
    expect(result.stderr).toContain("automated.quality.commit must match");
    expect(result.stderr).toContain("automated.security.version must match");
    expect(result.stderr).toContain("must not exceed 1000");
  });
});
