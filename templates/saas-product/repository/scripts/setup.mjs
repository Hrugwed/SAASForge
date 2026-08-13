import { randomBytes } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const example = path.join(root, "apps", "web", ".env.example");
const local = path.join(root, "apps", "web", ".env.local");

try {
  await stat(local);
  console.log(`Kept existing ${local}`);
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
  const secret = randomBytes(32).toString("base64url");
  const source = await readFile(example, "utf8");
  const configured = source.replace(
    /^BETTER_AUTH_SECRET=.*$/m,
    `BETTER_AUTH_SECRET=${secret}`,
  );
  await mkdir(path.dirname(local), { recursive: true });
  await writeFile(local, configured, { encoding: "utf8", flag: "wx" });
  console.log(`Created ${local}`);
}

console.log(
  "Next: pnpm product:doctor, pnpm db:deploy (when enabled), then pnpm dev",
);
