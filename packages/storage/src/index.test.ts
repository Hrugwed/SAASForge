import { describe, expect, it, vi } from "vitest";
import { createStorage } from "./index";

describe("storage module", () => {
  it("creates private tenant-prefixed upload keys", async () => {
    const signUpload = vi.fn().mockResolvedValue({
      url: "https://storage.example/upload",
      headers: { "content-type": "application/pdf" },
    });
    const storage = createStorage({
      signUpload,
      signDownload: vi.fn(),
      delete: vi.fn(),
    });
    const result = await storage.createUpload({
      organizationId: "org_123",
      fileName: "Quarterly report.pdf",
      contentType: "application/pdf",
      contentLength: 1_024,
    });
    expect(result.key).toMatch(
      /^organizations\/org_123\/.+-Quarterly-report\.pdf$/,
    );
    expect(signUpload).toHaveBeenCalledWith(
      expect.objectContaining({ contentLength: 1_024 }),
    );
  });

  it("rejects cross-tenant and traversal keys", async () => {
    const storage = createStorage({
      signUpload: vi.fn(),
      signDownload: vi.fn(),
      delete: vi.fn(),
    });
    await expect(
      storage.createDownload({
        organizationId: "org_a",
        key: "organizations/org_b/private.pdf",
      }),
    ).rejects.toThrow(/outside/);
    await expect(
      storage.delete({
        organizationId: "org_a",
        key: "organizations/org_a/../secret",
      }),
    ).rejects.toThrow();
  });
});
