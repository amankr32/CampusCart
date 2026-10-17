import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import argon2 from "argon2";
import { users, tenants, products, categories } from "../src/db/schema";
import { eq } from "drizzle-orm";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const client = postgres(dbUrl, { max: 1, prepare: false });
const db = drizzle(client);

async function main() {
  console.log("Seeding test user account...");

  const email = "demo@ikgptu.ac.in";
  const password = "Password123!";

  // Hash password using Argon2id
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });

  // Check if test account exists
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  let userId = existing?.id;

  if (existing) {
    console.log("Updating existing demo account...");
    await db
      .update(users)
      .set({
        passwordHash,
        emailVerifiedAt: new Date(),
        studentStatus: "verified",
        trustScore: 90,
        isAdmin: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));
  } else {
    console.log("Creating new demo account...");
    const [newUser] = await db
      .insert(users)
      .values({
        name: "Demo Student",
        email,
        passwordHash,
        username: "demostudent",
        emailVerifiedAt: new Date(),
        studentStatus: "verified",
        trustScore: 90,
        isAdmin: true,
        avatarUrl: null,
        bio: "Computer Science student at IKGPTU. Buying and selling semester textbooks & gadgets.",
        branch: "Computer Science Engineering",
        yearSemester: "3rd Year / 5th Sem",
        hostel: "Hostel 3",
      })
      .returning({ id: users.id });
    userId = newUser.id;
  }

  // Ensure tenant store exists
  let [tenant] = await db.select().from(tenants).where(eq(tenants.ownerId, userId)).limit(1);
  if (!tenant) {
    const [newTenant] = await db
      .insert(tenants)
      .values({
        ownerId: userId,
        storeName: "Demo Student's Store",
        slug: "demo-student-store",
      })
      .returning();
    tenant = newTenant;
  }

  // Ensure default categories exist or fetch one
  const allCategories = await db.select().from(categories).limit(2);
  let categoryId = allCategories[0]?.id;

  if (!categoryId) {
    const [cat] = await db
      .insert(categories)
      .values({
        name: "Textbooks & Notes",
        slug: "books",
      })
      .returning();
    categoryId = cat.id;
  }

  // Insert sample products for demo account
  const sampleProducts = [
    {
      tenantId: tenant.id,
      categoryId,
      name: "Higher Engineering Mathematics by B.S. Grewal",
      slug: "higher-engineering-mathematics-grewal",
      description: "Standard IKGPTU math textbook in excellent condition. Unmarked pages, complete 44th edition.",
      priceCents: 45000, // ₹450
      condition: "like_new" as const,
      hostel: "Hostel 3",
      branch: "Computer Science",
      quantity: 1,
      images: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80"],
      status: "available" as const,
    },
    {
      tenantId: tenant.id,
      categoryId,
      name: "Casio FX-991EX ClassWiz Scientific Calculator",
      slug: "casio-fx-991ex-scientific-calculator",
      description: "Original Casio FX-991EX scientific calculator with solar dual power. Perfect for exam hall.",
      priceCents: 75000, // ₹750
      condition: "good" as const,
      hostel: "Hostel 3",
      branch: "Computer Science",
      quantity: 1,
      images: ["https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=80"],
      status: "available" as const,
    },
  ];

  for (const prod of sampleProducts) {
    const [found] = await db.select({ id: products.id }).from(products).where(eq(products.slug, prod.slug)).limit(1);
    if (!found) {
      await db.insert(products).values(prod);
    }
  }

  console.log("\n=========================================");
  console.log("SUCCESS! Demo account ready:");
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Status:   Verified Email & Verified Student (Admin)`);
  console.log("=========================================\n");

  await client.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("Failed to seed demo account:", err);
  await client.end();
  process.exit(1);
});
