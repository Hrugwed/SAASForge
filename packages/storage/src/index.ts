import { randomUUID } from "node:crypto";
import { z } from "zod";

const identifierSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9_-]{1,160}$/);
const objectKeySchema = z
  .string()
  .min(1)
  .max(1_024)
  .refine(
    (key) => !key.startsWith("/") && !key.includes("..") && !key.includes("\\"),
    {
      message: "Object keys must be relative and cannot traverse directories.",
    },
  );

export const uploadRequestSchema = z.object({
  organizationId: identifierSchema,
  fileName: z.string().trim().min(1).max(180),
  contentType: z
    .string()
    .trim()
    .regex(/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i),
  contentLength: z
    .number()
    .int()
    .positive()
    .max(25 * 1024 * 1024),
  expiresInSeconds: z.number().int().min(60).max(900).default(300),
});

export const objectRequestSchema = z.object({
  organizationId: identifierSchema,
  key: objectKeySchema,
  expiresInSeconds: z.number().int().min(60).max(3_600).default(300),
});

type UploadRequest = z.output<typeof uploadRequestSchema> & { key: string };
type ObjectRequest = z.output<typeof objectRequestSchema>;

export interface StorageProvider {
  signUpload(
    input: UploadRequest,
  ): Promise<{ url: string; headers: Record<string, string> }>;
  signDownload(input: ObjectRequest): Promise<{ url: string }>;
  delete(input: Omit<ObjectRequest, "expiresInSeconds">): Promise<void>;
}

function safeFileName(fileName: string): string {
  const normalized = fileName
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9._-]+/g, "-");
  return normalized.replace(/^-+|-+$/g, "").slice(0, 120) || "file";
}

function assertTenantKey(organizationId: string, key: string): void {
  if (!key.startsWith(`organizations/${organizationId}/`)) {
    throw new Error(
      "The object key is outside the authenticated organization boundary.",
    );
  }
}

export function createStorage(provider: StorageProvider) {
  return {
    async createUpload(input: z.input<typeof uploadRequestSchema>) {
      const validated = uploadRequestSchema.parse(input);
      const key = `organizations/${validated.organizationId}/${randomUUID()}-${safeFileName(validated.fileName)}`;
      const signed = await provider.signUpload({ ...validated, key });
      return { key, ...signed, expiresInSeconds: validated.expiresInSeconds };
    },
    async createDownload(input: z.input<typeof objectRequestSchema>) {
      const validated = objectRequestSchema.parse(input);
      assertTenantKey(validated.organizationId, validated.key);
      return provider.signDownload(validated);
    },
    async delete(
      input: Omit<z.input<typeof objectRequestSchema>, "expiresInSeconds">,
    ) {
      const validated = objectRequestSchema
        .omit({ expiresInSeconds: true })
        .parse(input);
      assertTenantKey(validated.organizationId, validated.key);
      await provider.delete(validated);
    },
  };
}
