import { spawnSync } from "node:child_process";

const allowedLicenses = new Set([
  "(Apache-2.0 AND BSD-3-Clause)",
  "(MIT OR CC0-1.0)",
  "0BSD",
  "Apache-2.0",
  "Apache-2.0 AND LGPL-3.0-or-later",
  "BlueOak-1.0.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "CC-BY-4.0",
  "FSL-1.1-MIT",
  "EPL-2.0",
  "ISC",
  "MIT",
  "MIT and ISC",
  "MIT-0",
  "MPL-2.0",
  "Unlicense",
]);

const result = spawnSync("pnpm", ["licenses", "list", "--prod", "--json"], {
  encoding: "utf8",
  shell: process.platform === "win32",
  stdio: ["ignore", "pipe", "inherit"],
  timeout: 60_000,
});

if (result.status !== 0) {
  console.error("Unable to inspect production dependency licenses.");
  process.exit(1);
}

const licenses = Object.keys(JSON.parse(result.stdout));
const unreviewed = licenses.filter((license) => !allowedLicenses.has(license));
if (unreviewed.length) {
  console.error(`Unreviewed production licenses: ${unreviewed.join(", ")}`);
  console.error(
    "Review the dependency and legal implications before updating the allowlist.",
  );
  process.exit(1);
}

console.log(
  `License policy passed for ${licenses.length} license expressions.`,
);
