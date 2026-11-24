import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { users, tenants } from "../src/db/schema";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ DATABASE_URL is not set in .env");
  process.exit(1);
}

const client = postgres(dbUrl, { max: 1, prepare: false });
const db = drizzle(client);

async function main() {
  const targetEmail = process.argv[2]?.trim().toLowerCase();
  const targetPassword = process.argv[3] || "AdminPass123!";

  if (!targetEmail) {
    console.log(`
=============================================================================
🛠️  CAMPUSCART ADMIN CREATION & PROMOTION TOOL
=============================================================================
Usage:
  npx tsx scripts/make-admin.ts <email> [optional_password]

Examples:
  1. Promote an existing user to Admin:
     npx tsx scripts/make-admin.ts student@ikgptu.ac.in

  2. Create a new Admin account with a custom password:
     npx tsx scripts/make-admin.ts admin@campuscart.local MySecurePass123!
=============================================================================
`);
    process.exit(0);
  }

  console.log(`🔍 Checking account for: ${targetEmail}...`);

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, targetEmail))
    .limit(1);

  if (existingUser) {
    console.log(`✅ Existing user found: ${existingUser.name} (@${existingUser.username})`);
    console.log(`🚀 Promoting to Administrator...`);

    const updateData: Record<string, unknown> = {
      isAdmin: true,
      emailVerifiedAt: existingUser.emailVerifiedAt || new Date(),
      studentStatus: "verified",
      trustScore: Math.max(existingUser.trustScore, 95),
      updatedAt: new Date(),
    };

    if (process.argv[3]) {
      console.log(`🔑 Updating password to: ${targetPassword}`);
      const newPasswordHash = await argon2.hash(targetPassword, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 1,
      });
      updateData.passwordHash = newPasswordHash;
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, existingUser.id));

    console.log(`🎉 SUCCESS! Account "${targetEmail}" updated and is now an Administrator.`);
    console.log(`👉 Log in at http://localhost:3000/sign-in with password: ${process.argv[3] ? targetPassword : "(existing password)"}`);
  } else {
    console.log(`🆕 User does not exist. Creating new Administrator account...`);

    const passwordHash = await argon2.hash(targetPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });

    const usernameBase = targetEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "admin";
    const username = `${usernameBase}_admin`;

    const [newUser] = await db
      .insert(users)
      .values({
        name: "Campus Administrator",
        email: targetEmail,
        username,
        passwordHash,
        isAdmin: true,
        emailVerifiedAt: new Date(),
        studentStatus: "verified",
        trustScore: 100,
        bio: "CampusCart System Administrator",
        branch: "Administration",
        hostel: "Admin Block",
      })
      .returning();

    // Create storefront tenant
    await db
      .insert(tenants)
      .values({
        ownerId: newUser.id,
        storeName: "Campus Admin Store",
        slug: `${username}-store`,
      })
      .onConflictDoNothing();

    console.log(`
=============================================================================
🎉 NEW ADMIN ACCOUNT CREATED SUCCESSFULLY!
=============================================================================
Email:    ${targetEmail}
Password: ${targetPassword}
Username: @${username}
Role:     Administrator (Full access to /admin)
=============================================================================
👉 Go to: http://localhost:3000/sign-in
Log in with the credentials above to access the Admin Command Center!
`);
  }

  await client.end();
}

main().catch((err) => {
  console.error("❌ Error setting up admin:", err);
  process.exit(1);
});
