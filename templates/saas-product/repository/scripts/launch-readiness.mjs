import { readFile } from "node:fs/promises";
import path from "node:path";

const requiredAlerts = [
  "uptime",
  "errors",
  "latency",
  "billing-drift",
  "email-failures",
  "job-backlog",
];
const errors = [];

function objectAt(value, location) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${location} must be an object.`);
    return {};
  }
  return value;
}

function textAt(value, location) {
  if (
    typeof value !== "string" ||
    value.trim().length < 3 ||
    /replace|example|todo|unknown|unassigned|change-me/i.test(value)
  ) {
    errors.push(`${location} must be assigned and cannot be a placeholder.`);
    return "";
  }
  return value;
}

function urlAt(value, location) {
  try {
    const parsed = new URL(value);
    if (
      parsed.protocol !== "https:" ||
      /replace|example|change-me/i.test(value)
    ) {
      throw new Error("not usable evidence");
    }
  } catch {
    errors.push(`${location} must be a valid HTTPS evidence URL.`);
  }
}

function dateAt(value, location, maximumAgeDays) {
  const timestamp = Date.parse(value);
  const age = Date.now() - timestamp;
  if (
    typeof value !== "string" ||
    !Number.isFinite(timestamp) ||
    age < -300_000 ||
    age > maximumAgeDays * 86_400_000
  ) {
    errors.push(
      `${location} must be a valid UTC date from the last ${maximumAgeDays} days.`,
    );
  }
}

function positiveNumberAt(value, location) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    errors.push(`${location} must be a positive number.`);
  }
}

function passedGate(
  value,
  location,
  expectedCommit,
  expectedVersion,
  maximumAgeDays = 30,
) {
  const gate = objectAt(value, location);
  if (gate.status !== "passed")
    errors.push(`${location}.status must be passed.`);
  if (gate.commit !== expectedCommit) {
    errors.push(`${location}.commit must match the commit being deployed.`);
  }
  if (gate.version !== expectedVersion) {
    errors.push(`${location}.version must match the version being deployed.`);
  }
  dateAt(gate.completedAt, `${location}.completedAt`, maximumAgeDays);
  urlAt(gate.evidenceUrl, `${location}.evidenceUrl`);
  return gate;
}

const evidenceFlag = process.argv.indexOf("--evidence");
const commitFlag = process.argv.indexOf("--commit");
const versionFlag = process.argv.indexOf("--version");
const evidencePath =
  evidenceFlag >= 0
    ? process.argv[evidenceFlag + 1]
    : "docs/launch-evidence.json";
const expectedCommit =
  commitFlag >= 0 ? process.argv[commitFlag + 1] : undefined;
const expectedVersion =
  versionFlag >= 0 ? process.argv[versionFlag + 1] : undefined;

if (!evidencePath || !expectedCommit || !expectedVersion) {
  console.error(
    "[FAIL] --evidence, --commit, and --version require explicit values.",
  );
  process.exit(1);
}

let evidence;
try {
  evidence = JSON.parse(await readFile(path.resolve(evidencePath), "utf8"));
} catch {
  console.error(`[FAIL] Could not read valid JSON from ${evidencePath}.`);
  process.exit(1);
}

const root = objectAt(evidence, "evidence");
if (root.schemaVersion !== 1) errors.push("schemaVersion must be 1.");

const release = objectAt(root.release, "release");
textAt(release.version, "release.version");
if (release.version !== expectedVersion) {
  errors.push("release.version must match the version being deployed.");
}
if (
  typeof release.commit !== "string" ||
  !/^[a-f0-9]{40}$/i.test(release.commit)
) {
  errors.push("release.commit must be a full 40-character Git commit SHA.");
} else if (release.commit.toLowerCase() !== expectedCommit.toLowerCase()) {
  errors.push("release.commit must match the commit being deployed.");
}
textAt(release.owner, "release.owner");
dateAt(release.reviewedAt, "release.reviewedAt", 30);
urlAt(release.evidenceUrl, "release.evidenceUrl");

const automated = objectAt(root.automated, "automated");
passedGate(
  automated.quality,
  "automated.quality",
  expectedCommit,
  expectedVersion,
);
passedGate(
  automated.security,
  "automated.security",
  expectedCommit,
  expectedVersion,
);

const accessibility = passedGate(
  automated.accessibility,
  "automated.accessibility",
  expectedCommit,
  expectedVersion,
);
if (accessibility.standard !== "WCAG 2.1 AA") {
  errors.push("automated.accessibility.standard must be WCAG 2.1 AA.");
}
if (accessibility.seriousOrCriticalViolations !== 0) {
  errors.push("automated.accessibility.seriousOrCriticalViolations must be 0.");
}
if (accessibility.keyboardJourney !== true) {
  errors.push("automated.accessibility.keyboardJourney must be true.");
}

const performanceGate = passedGate(
  automated.performance,
  "automated.performance",
  expectedCommit,
  expectedVersion,
);
positiveNumberAt(
  performanceGate.concurrentRequests,
  "automated.performance.concurrentRequests",
);
positiveNumberAt(
  performanceGate.p95Milliseconds,
  "automated.performance.p95Milliseconds",
);
positiveNumberAt(
  performanceGate.budgetP95Milliseconds,
  "automated.performance.budgetP95Milliseconds",
);
if (performanceGate.concurrentRequests < 20) {
  errors.push("automated.performance.concurrentRequests must be at least 20.");
}
if (performanceGate.budgetP95Milliseconds > 1_000) {
  errors.push(
    "automated.performance.budgetP95Milliseconds must not exceed 1000.",
  );
}
if (performanceGate.p95Milliseconds > performanceGate.budgetP95Milliseconds) {
  errors.push("automated.performance.p95Milliseconds exceeds its budget.");
}

const restore = passedGate(
  root.restore,
  "restore",
  expectedCommit,
  expectedVersion,
  180,
);
textAt(restore.operator, "restore.operator");
textAt(restore.isolatedTarget, "restore.isolatedTarget");
positiveNumberAt(restore.rpoMinutes, "restore.rpoMinutes");
positiveNumberAt(restore.rtoMinutes, "restore.rtoMinutes");
positiveNumberAt(
  restore.actualRecoveryMinutes,
  "restore.actualRecoveryMinutes",
);
if (restore.actualRecoveryMinutes > restore.rtoMinutes) {
  errors.push("restore.actualRecoveryMinutes exceeds restore.rtoMinutes.");
}

const rollback = passedGate(
  root.rollback,
  "rollback",
  expectedCommit,
  expectedVersion,
  180,
);
textAt(rollback.operator, "rollback.operator");
textAt(rollback.fromDeployment, "rollback.fromDeployment");
textAt(rollback.toDeployment, "rollback.toDeployment");
positiveNumberAt(rollback.durationMinutes, "rollback.durationMinutes");

if (!Array.isArray(root.alerts)) {
  errors.push("alerts must be an array.");
} else {
  const alertSignals = new Set();
  for (const [index, value] of root.alerts.entries()) {
    const alert = objectAt(value, `alerts[${index}]`);
    if (
      !requiredAlerts.includes(alert.signal) ||
      alertSignals.has(alert.signal)
    ) {
      errors.push(`alerts[${index}].signal must be a unique required signal.`);
    }
    alertSignals.add(alert.signal);
    textAt(alert.owner, `alerts[${index}].owner`);
    textAt(alert.route, `alerts[${index}].route`);
    dateAt(alert.testedAt, `alerts[${index}].testedAt`, 90);
    urlAt(alert.evidenceUrl, `alerts[${index}].evidenceUrl`);
  }
  for (const signal of requiredAlerts) {
    if (!alertSignals.has(signal)) errors.push(`alerts is missing ${signal}.`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[FAIL] ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `[PASS] Launch evidence is complete for ${release.version} (${release.commit}).`,
  );
}
