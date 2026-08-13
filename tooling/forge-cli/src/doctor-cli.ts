import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatDoctorReport, runDoctor } from "./doctor";

const json = process.argv.includes("--json");
const rootOption = process.argv.indexOf("--root");
const defaultRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const root =
  rootOption >= 0 && process.argv[rootOption + 1]
    ? path.resolve(process.argv[rootOption + 1]!)
    : defaultRoot;
const report = await runDoctor(root);
console.log(
  json ? JSON.stringify(report, null, 2) : formatDoctorReport(report),
);
if (!report.ok) process.exitCode = 1;
