import path from "node:path";
import { config as loadEnvironment } from "dotenv";
import { defineConfig } from "prisma/config";

for (const application of ["web", "factory"]) {
  loadEnvironment({
    path: path.resolve(process.cwd(), "../../apps", application, ".env.local"),
    quiet: true,
  });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  ...(process.env.DATABASE_URL
    ? { datasource: { url: process.env.DATABASE_URL } }
    : {}),
});
