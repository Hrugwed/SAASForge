import { afterEach, describe, expect, it } from "vitest";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { isPlaceholder, parseEnvironment } from "./environment";
import { setupFactory } from "./setup";

let root: string | undefined;

afterEach(async () => {
  if (root) await rm(root, { recursive: true, force: true });
  root = undefined;
});

describe("factory setup", () => {
  it("creates a private environment with a generated secret", async () => {
    root = await mkdtemp(path.join(tmpdir(), "saasforge-setup-"));
    await mkdir(path.join(root, "apps", "factory"), { recursive: true });
    await writeFile(
      path.join(root, ".env.example"),
      "DATABASE_URL=postgresql://local\nBETTER_AUTH_SECRET=replace-me\n",
    );
    const result = await setupFactory(root, { secret: () => "a".repeat(43) });
    const environment = parseEnvironment(
      await readFile(result.environmentPath, "utf8"),
    );
    expect(result.created).toBe(true);
    expect(environment.BETTER_AUTH_SECRET).toBe("a".repeat(43));
    expect(isPlaceholder(environment.BETTER_AUTH_SECRET)).toBe(false);
  });

  it("never overwrites an existing local environment", async () => {
    root = await mkdtemp(path.join(tmpdir(), "saasforge-setup-"));
    const app = path.join(root, "apps", "factory");
    await mkdir(app, { recursive: true });
    await writeFile(
      path.join(root, ".env.example"),
      "BETTER_AUTH_SECRET=replace-me\n",
    );
    await writeFile(
      path.join(app, ".env.local"),
      "BETTER_AUTH_SECRET=keep-this-secret\n",
    );
    const result = await setupFactory(root, { secret: () => "do-not-write" });
    expect(result.created).toBe(false);
    await expect(readFile(result.environmentPath, "utf8")).resolves.toContain(
      "keep-this-secret",
    );
  });
});
