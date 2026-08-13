import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const manifest = JSON.parse(
  await readFile(path.join(root, "saasforge.manifest.json"), "utf8"),
);

async function fingerprint(relative) {
  try {
    const content = await readFile(path.join(root, relative));
    return createHash("sha256").update(content).digest("hex");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

const managed = manifest.managedFiles ?? {};
const changed = [];
const deleted = [];
for (const [relative, expected] of Object.entries(managed)) {
  const current = await fingerprint(relative);
  if (current === null) deleted.push(relative);
  else if (current !== expected) changed.push(relative);
}

console.log(`Factory version: ${manifest.factory?.version ?? "unknown"}`);
console.log(`Managed files: ${Object.keys(managed).length}`);
console.log(`Customized files: ${changed.length}`);
console.log(`Deleted files: ${deleted.length}`);
for (const relative of changed) console.log(`[CUSTOMIZED] ${relative}`);
for (const relative of deleted) console.log(`[DELETED] ${relative}`);

if (!Object.keys(managed).length) {
  console.error("This product predates managed-file fingerprints.");
  process.exitCode = 1;
}
