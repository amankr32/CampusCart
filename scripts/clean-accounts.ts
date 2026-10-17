import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  users,
  tenants,
  products,
  orders,
  conversations,
  messages,
  reviews,
  verificationCodes,
  passwordResetTokens,
  studentVerifications,
  reports,
  auditLogs,
} from "../src/db/schema";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const client = postgres(dbUrl, { max: 1, prepare: false });
const db = drizzle(client);

async function main() {
  console.log("Checking existing user accounts in database...");
  const allUsers = await db
    .select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt })
    .from(users);

  console.log(`Found ${allUsers.length} user account(s):`);
  console.log(JSON.stringify(allUsers, null, 2));

  if (allUsers.length === 0) {
    console.log("No accounts found to remove.");
    await client.end();
    process.exit(0);
  }

  console.log("Cleaning up dependent tables...");
  await db.delete(messages);
  await db.delete(conversations);
  await db.delete(orders);
  await db.delete(reviews);
  await db.delete(reports);
  await db.delete(products);
  await db.delete(tenants);
  await db.delete(verificationCodes);
  await db.delete(passwordResetTokens);
  await db.delete(studentVerifications);
  await db.delete(auditLogs);

  console.log("Removing all user accounts...");
  const deleted = await db.delete(users).returning({ id: users.id, email: users.email });

  console.log(`Successfully removed ${deleted.length} user account(s):`);
  console.log(JSON.stringify(deleted, null, 2));

  await client.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("Failed to clean accounts:", err);
  await client.end();
  process.exit(1);
});
