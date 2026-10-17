import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { resolveDatabaseUrl, shouldUseNeonServerless } from "@/lib/db-config";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to your .env file.");
}

const connectionString = resolveDatabaseUrl(process.env.DATABASE_URL);

function initDatabase() {
  // In serverless environments (e.g. Vercel) connecting to Neon, use @neondatabase/serverless over HTTP fetch.
  // This completely bypasses TCP handshake latency, eliminates socket cold starts (ECONNRESET/CONNECT_TIMEOUT),
  // and removes connection limits across serverless functions.
  if (shouldUseNeonServerless(process.env, connectionString)) {
    const client = neon(connectionString);
    return drizzleNeon(client, { schema }) as unknown as PostgresJsDatabase<
      typeof schema
    >;
  }

  // Persistent Node.js runtime / local dev environment:
  // Use postgres-js with connection pooling, reused across hot-reloads.
  const globalForDb = globalThis as unknown as {
    queryClient: postgres.Sql | undefined;
  };

  const queryClient =
    globalForDb.queryClient ??
    postgres(connectionString, {
      max: process.env.NODE_ENV === "production" ? 10 : 5,
      idle_timeout: 20,
      connect_timeout: 30, // 30s timeout handles Neon cold starts gracefully without failing
      prepare: false, // Disables prepared statement caching for Neon/PgBouncer pooler compatibility
      connection: {
        application_name: "campuscart",
      },
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.queryClient = queryClient;
  }

  return drizzlePostgres(queryClient, { schema });
}

export const db = initDatabase();

