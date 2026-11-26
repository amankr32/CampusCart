import type { BatchItem } from "drizzle-orm/batch";
import type { db as dbInstance } from "@/db";

type DbClient = typeof dbInstance;
type BatchableQuery = BatchItem<"pg">;

type NeonBatchDb = {
  batch: (
    queries: readonly [BatchableQuery, ...BatchableQuery[]]
  ) => Promise<unknown[]>;
};

/**
 * Executes a list of write queries atomically across both Drizzle drivers:
 * - On `neon-http` (serverless HTTP fetch), uses `db.batch(...)` which runs inside a single
 *   PostgreSQL transaction over HTTP, avoiding interactive `db.transaction(...)` which throws
 *   "No transactions support in neon-http driver".
 * - On `postgres-js` (persistent Node.js / local dev), runs each query sequentially inside `db.transaction(...)`.
 */
export async function runAtomicBatch(
  dbClient: DbClient,
  buildQueries: (tx: DbClient) => BatchableQuery[]
): Promise<unknown[]> {
  const batchable = dbClient as unknown as Partial<NeonBatchDb>;

  if (typeof batchable.batch === "function") {
    const queries = buildQueries(dbClient);
    if (queries.length === 0) {
      return [];
    }
    return batchable.batch(
      queries as [BatchableQuery, ...BatchableQuery[]]
    );
  }

  return dbClient.transaction(async (tx) => {
    const txClient = tx as unknown as DbClient;
    const queries = buildQueries(txClient);
    const results: unknown[] = [];
    for (const query of queries) {
      results.push(await (query as unknown as Promise<unknown>));
    }
    return results;
  });
}
