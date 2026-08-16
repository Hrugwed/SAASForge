import { describe, expect, it } from "vitest";
import { spawn } from "node:child_process";
import path from "node:path";

describe("factory launcher", () => {
  it("rejects an attached hostname override before starting Next.js", async () => {
    const result = await new Promise<{ code: number | null; stderr: string }>(
      (resolve) => {
        const child = spawn(
          process.execPath,
          [
            path.resolve(process.cwd(), "start-factory.mjs"),
            "start",
            "loopback",
            "-H0.0.0.0",
          ],
          { stdio: ["ignore", "ignore", "pipe"], windowsHide: true },
        );
        let stderr = "";
        child.stderr.setEncoding("utf8");
        child.stderr.on("data", (chunk: string) => {
          stderr += chunk;
        });
        child.once("close", (code) => resolve({ code, stderr }));
      },
    );

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain("launcher owns hostname binding");
  });
});
