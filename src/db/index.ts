import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to your .env file.");
}

// A single connection pool, reused across hot-reloads in dev so we don't
// leak connections every time a file changes.
const globalForDb = globalThis as unknown as {
  queryClient: postgres.Sql | undefined;
};

const queryClient =
  globalForDb.queryClient ?? postgres(process.env.DATABASE_URL);

if (process.env.NODE_ENV !== "production") {
  globalForDb.queryClient = queryClient;
}

export const db = drizzle(queryClient, { schema });
