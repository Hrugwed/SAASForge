import { describe, expect, it, vi } from "vitest";
import {
  assertSupportedNode,
  databaseAction,
  databaseStartFallback,
  databaseUrlFromPrismaOutput,
  factoryPortAction,
  isFactoryHealth,
  prepareFactory,
  setEnvironmentValue,
  startLocalDatabase,
} from "../../bootstrap-factory.mjs";
import { validateFactoryEnvironment } from "../../smoke-factory-setup.mjs";

describe("factory bootstrap", () => {
  it("runs preparation in dependency order", async () => {
    const calls = [];
    const step = (name) => vi.fn(async () => calls.push(name));

    await prepareFactory({
      install: step("install"),
      setup: step("setup"),
      generate: step("generate"),
      database: step("database"),
      deploy: step("deploy"),
    });

    expect(calls).toEqual([
      "install",
      "setup",
      "generate",
      "database",
      "deploy",
    ]);
  });

  it("enforces the repository Node range before installation", () => {
    expect(() => assertSupportedNode("v22.14.0")).not.toThrow();
    expect(() => assertSupportedNode("v24.19.0")).toThrow(
      "Install Node >=22.14.0 <23",
    );
  });

  it("extracts a local Prisma URL without exposing it to other config", () => {
    const url = databaseUrlFromPrismaOutput(
      "Ready: postgres://postgres:secret@localhost:51214/template1?sslmode=disable",
    );
    expect(url).toBe(
      "postgres://postgres:secret@localhost:51214/saasforge?sslmode=disable",
    );
    expect(
      setEnvironmentValue(
        "DATABASE_URL=postgresql://old\nBETTER_AUTH_SECRET=keep-me\n",
        "DATABASE_URL",
        url,
      ),
    ).toBe(`DATABASE_URL=${url}\nBETTER_AUTH_SECRET=keep-me\n`);
  });

  it("recognizes only the SaaSForge health contract", () => {
    expect(
      isFactoryHealth({ status: "ok", service: "saasforge-factory" }),
    ).toBe(true);
    expect(isFactoryHealth({ status: "ok", service: "another-app" })).toBe(
      false,
    );
  });

  it("selects Docker or Prisma only for an unreachable local database", () => {
    expect(
      databaseAction({ dockerAvailable: false, local: true, reachable: true }),
    ).toBe("use-configured");
    expect(
      databaseAction({ dockerAvailable: true, local: true, reachable: false }),
    ).toBe("start-docker");
    expect(
      databaseAction({ dockerAvailable: false, local: true, reachable: false }),
    ).toBe("start-prisma");
    expect(
      databaseAction({
        dockerAvailable: false,
        local: false,
        reachable: false,
      }),
    ).toBe("reject-external");
    expect(databaseStartFallback("start-docker", true)).toBe("start-docker");
    expect(databaseStartFallback("start-docker", false)).toBe("start-prisma");
  });

  it("starts Prisma when Docker Compose cannot start PostgreSQL", async () => {
    const calls = [];
    const databaseUrl = await startLocalDatabase("start-docker", {
      startDocker: async () => {
        calls.push("docker");
        return false;
      },
      startPrisma: async () => {
        calls.push("prisma");
        return "postgresql://local/saasforge";
      },
    });

    expect(calls).toEqual(["docker", "prisma"]);
    expect(databaseUrl).toBe("postgresql://local/saasforge");
  });

  it("refuses an occupied port unless it serves the factory health contract", () => {
    expect(factoryPortAction({ healthy: true, portOpen: true })).toBe(
      "use-running",
    );
    expect(factoryPortAction({ healthy: false, portOpen: true })).toBe(
      "reject-occupied",
    );
    expect(factoryPortAction({ healthy: false, portOpen: false })).toBe(
      "start-factory",
    );
  });

  it("validates generated setup config without exposing its secret", () => {
    const environment = [
      "NEXT_PUBLIC_APP_URL=http://localhost:3000",
      "DATABASE_URL=postgresql://user:secret@127.0.0.1:5432/saasforge",
      `BETTER_AUTH_SECRET=${"s".repeat(32)}`,
      "BETTER_AUTH_URL=http://localhost:3000",
      "SAASFORGE_LOCAL_OPERATOR_MODE=enabled",
      "SAASFORGE_OPERATOR_ORGANIZATION_ID=",
    ].join("\n");

    expect(() => validateFactoryEnvironment(environment)).not.toThrow();
    expect(() =>
      validateFactoryEnvironment(
        environment.replace(
          `BETTER_AUTH_SECRET=${"s".repeat(32)}`,
          "BETTER_AUTH_SECRET=replace-with-at-least-32-random-characters",
        ),
      ),
    ).toThrow("did not generate a private auth secret");
    expect(() =>
      validateFactoryEnvironment(
        environment.replace(
          "SAASFORGE_LOCAL_OPERATOR_MODE=enabled",
          "SAASFORGE_LOCAL_OPERATOR_MODE=disabled",
        ),
      ),
    ).toThrow("did not enable loopback operator mode");
  });
});
