import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const globalForDatabase = globalThis as unknown as {
  saasForgeDatabase?: PrismaClient;
};

function createDatabaseClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is required. Copy the application's .env.example to its local environment file before starting it.",
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

export const database =
  globalForDatabase.saasForgeDatabase ?? createDatabaseClient();

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.saasForgeDatabase = database;
}
