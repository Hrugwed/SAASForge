import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { createLogger, withLogContext } from "./index";

describe("structured logger", () => {
  it("emits correlation fields and redacts common secret fields", async () => {
    let output = "";
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        output += chunk.toString();
        callback();
      },
    });
    const logger = createLogger({
      service: "test-service",
      destination,
    });

    withLogContext(logger, {
      requestId: "request-1",
      organizationId: "org-1",
    }).info(
      {
        authorization: "Bearer private",
        password: "private",
        nested: { token: "private" },
      },
      "handled request",
    );

    await new Promise<void>((resolve) => destination.end(resolve));
    const entry = JSON.parse(output) as Record<string, unknown>;
    expect(entry).toMatchObject({
      service: "test-service",
      requestId: "request-1",
      organizationId: "org-1",
      authorization: "[REDACTED]",
      password: "[REDACTED]",
      nested: { token: "[REDACTED]" },
      msg: "handled request",
    });
    expect(output).not.toContain("private");
  });

  it("rejects unbounded or structured context fields", () => {
    const logger = createLogger({ service: "test-service" });
    expect(() =>
      withLogContext(logger, { unsafe: { nested: true } } as never),
    ).toThrow();
  });
});
