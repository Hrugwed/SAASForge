import { expect, test } from "@playwright/test";

const requestCount = 20;
const maxP95Milliseconds = 1_000;
const maxResponseBytes = 2_048;

test("health endpoint stays within the basic load budget", async ({
  request,
}) => {
  await request.get("/api/health");

  const samples = await Promise.all(
    Array.from({ length: requestCount }, async () => {
      const startedAt = performance.now();
      const response = await request.get("/api/health");
      const duration = performance.now() - startedAt;
      const body = await response.body();

      expect(response.status()).toBe(200);
      expect(body.byteLength).toBeLessThanOrEqual(maxResponseBytes);
      return duration;
    }),
  );

  const ordered = samples.toSorted((left, right) => left - right);
  const p95 = ordered[Math.ceil(ordered.length * 0.95) - 1];
  console.info(
    `performance_budget=${JSON.stringify({ requestCount, p95Milliseconds: Math.round(p95), maxP95Milliseconds, maxResponseBytes })}`,
  );
  expect(p95).toBeLessThanOrEqual(maxP95Milliseconds);
});
