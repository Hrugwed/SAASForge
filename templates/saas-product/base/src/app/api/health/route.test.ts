import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("health endpoint", () => {
  it("returns a non-cacheable healthy response", async () => {
    const response = GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.service).toBe("__PRODUCT_SLUG__");
  });
});
