import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import type { StorageProvider } from "./index";

const r2ConfigSchema = z.object({
  accountId: z.string().trim().min(8),
  accessKeyId: z.string().trim().min(8),
  secretAccessKey: z.string().trim().min(16),
  bucket: z.string().trim().min(3).max(63),
});

export function createR2StorageProvider(
  input: z.input<typeof r2ConfigSchema>,
): StorageProvider {
  const config = r2ConfigSchema.parse(input);
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return {
    async signUpload(request) {
      const command = new PutObjectCommand({
        Bucket: config.bucket,
        Key: request.key,
        ContentType: request.contentType,
        ContentLength: request.contentLength,
      });
      return {
        url: await getSignedUrl(client, command, {
          expiresIn: request.expiresInSeconds,
        }),
        headers: {
          "content-type": request.contentType,
          "content-length": String(request.contentLength),
        },
      };
    },
    async signDownload(request) {
      const command = new GetObjectCommand({
        Bucket: config.bucket,
        Key: request.key,
      });
      return {
        url: await getSignedUrl(client, command, {
          expiresIn: request.expiresInSeconds,
        }),
      };
    },
    async delete(request) {
      await client.send(
        new DeleteObjectCommand({ Bucket: config.bucket, Key: request.key }),
      );
    },
  };
}
