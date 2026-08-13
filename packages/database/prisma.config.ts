import path from "node:path";
import { config as loadEnvironment } from "dotenv";
import { defineConfig } from "prisma/config";

for (const application of ["web", "factory"]) {
  loadEnvironment({
    path: path.resolve(process.cwd(), "../../apps", application, ".env.local"),
    quiet: true,
  });
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required. Run the repository setup command before using Prisma.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
