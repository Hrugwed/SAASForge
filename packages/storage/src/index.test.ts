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

  it("rejects unapproved content types and product-specific size excess", async () => {
    const signUpload = vi.fn();
    const storage = createStorage(
      {
        signUpload,
        signDownload: vi.fn(),
        delete: vi.fn(),
      },
      {
        allowedContentTypes: new Set(["application/pdf"]),
        maximumUploadBytes: 1_024,
      },
    );
    await expect(
      storage.createUpload({
        organizationId: "org_a",
        fileName: "script.svg",
        contentType: "image/svg+xml",
        contentLength: 100,
      }),
    ).rejects.toThrow(/file type/);
    await expect(
      storage.createUpload({
        organizationId: "org_a",
        fileName: "large.pdf",
        contentType: "application/pdf",
        contentLength: 2_048,
      }),
    ).rejects.toThrow(/size limit/);
    expect(signUpload).not.toHaveBeenCalled();
  });
});
