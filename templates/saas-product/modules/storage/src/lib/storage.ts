import "server-only";
import { createStorage } from "@saasforge/storage";
import { createR2StorageProvider } from "@saasforge/storage/server";

let storage: ReturnType<typeof createStorage> | undefined;

export function getStorage() {
  if (storage) return storage;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      "CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET are required when storage is enabled.",
    );
  }
  storage = createStorage(
    createR2StorageProvider({
      accountId,
      accessKeyId,
      secretAccessKey,
      bucket,
    }),
  );
  return storage;
}
