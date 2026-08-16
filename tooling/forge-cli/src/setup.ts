import { randomBytes } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

async function exists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT")
      return false;
    throw error;
  }
}

export type SetupResult = {
  environmentPath: string;
  created: boolean;
  next: string[];
};

export async function setupFactory(
  repositoryRoot: string,
  options: { secret?: () => string } = {},
): Promise<SetupResult> {
  const root = path.resolve(repositoryRoot);
  const templatePath = path.join(root, ".env.example");
  const environmentPath = path.join(root, "apps", "factory", ".env.local");
  if (await exists(environmentPath)) {
    return {
      environmentPath,
      created: false,
      next: [
        "pnpm factory:doctor",
        "docker compose up -d",
        "pnpm db:deploy",
        "pnpm dev",
      ],
    };
  }
  const generatedSecret =
    options.secret?.() ?? randomBytes(32).toString("base64url");
  const template = await readFile(templatePath, "utf8");
  const configured = template
    .replace(
      /^BETTER_AUTH_SECRET=.*$/m,
      `BETTER_AUTH_SECRET=${generatedSecret}`,
    )
    .replace(
      /^SAASFORGE_LOCAL_OPERATOR_MODE=.*$/m,
      "SAASFORGE_LOCAL_OPERATOR_MODE=enabled",
    );
  await mkdir(path.dirname(environmentPath), { recursive: true });
  await writeFile(environmentPath, configured, {
    encoding: "utf8",
    flag: "wx",
  });
  return {
    environmentPath,
    created: true,
    next: [
      "pnpm factory:doctor",
      "docker compose up -d",
      "pnpm db:deploy",
      "pnpm dev",
    ],
  };
}
