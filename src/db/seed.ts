import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import bcrypt from "bcryptjs";

import * as schema from "./schema";

// Note: this script runs standalone via `tsx`, outside the Next.js build
// pipeline, so it can't import from src/lib/password.ts — that file is
// marked "server-only", a Next.js guard that intentionally throws outside
// Next's server runtime to prevent accidental client-bundle leaks.
function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, 12);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client, { schema });

  console.log("Seeding categories...");

  const categoryList = [
    { name: "Textbooks & Notes", slug: "books", color: "#FFC009" },
    { name: "Hostel Essentials", slug: "hostel", color: "#8FD3FE" },
    { name: "Cycles & Transport", slug: "transport", color: "#A0E6A0" },
    { name: "Electronics & Gadgets", slug: "electronics", color: "#FFB1B1" },
    { name: "Stationery & Supplies", slug: "stationery", color: "#D9C2FF" },
    { name: "Sports & Fitness", slug: "sports", color: "#FFD9A0" },
  ];

  await db
    .insert(schema.categories)
    .values(categoryList)
    .onConflictDoNothing({ target: schema.categories.slug });

  console.log("Seeding a demo student account...");

  const demoPasswordHash = await hashPassword("demo12345");

  await db
    .insert(schema.users)
    .values({
      name: "Demo Student",
      username: "demo_student",
      email: "demo@ikgptu.ac.in",
      passwordHash: demoPasswordHash,
      hostel: "Block C",
      branch: "CSE",
    })
    .onConflictDoNothing({ target: schema.users.email });

  const [demoUser] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, "demo@ikgptu.ac.in"))
    .limit(1);

  console.log("Seeding a demo store and listings...");

  await db
    .insert(schema.tenants)
    .values({
      ownerId: demoUser.id,
      storeName: "Demo Student's Store",
      slug: "demo-store",
    })
    .onConflictDoNothing({ target: schema.tenants.slug });

  const [demoTenant] = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.slug, "demo-store"))
    .limit(1);

  const insertedCategories = await db.select().from(schema.categories);
  const categoryBySlug = new Map(
    insertedCategories.map((category) => [category.slug, category])
  );

  const demoProducts = [
    {
      name: "Engineering Mathematics Vol. 2 (7th Sem)",
      slug: "engineering-mathematics-vol-2",
      description:
        "Barely used, no torn pages. Covers the full 7th semester syllabus with solved examples.",
      priceCents: 25000,
      condition: "like_new" as const,
      categorySlug: "books",
      hostel: "Block C",
      images: [
        "https://images.unsplash.com/photo-1509266272358-7701da638078?w=800",
      ],
    },
    {
      name: "Study Table Lamp",
      slug: "study-table-lamp",
      description:
        "Adjustable brightness, USB powered. Perfect for late-night study sessions.",
      priceCents: 45000,
      condition: "good" as const,
      categorySlug: "hostel",
      hostel: "Block C",
      images: [
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
      ],
    },
    {
      name: "Hero Sprint Cycle",
      slug: "hero-sprint-cycle",
      description:
        "Great for getting around campus quickly. Minor scratches, fully functional gears and brakes.",
      priceCents: 350000,
      condition: "fair" as const,
      categorySlug: "transport",
      hostel: "Block A",
      images: [
        "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800",
      ],
    },
  ];

  for (const product of demoProducts) {
    await db
      .insert(schema.products)
      .values({
        tenantId: demoTenant.id,
        categoryId: categoryBySlug.get(product.categorySlug)?.id ?? null,
        name: product.name,
        slug: product.slug,
        description: product.description,
        priceCents: product.priceCents,
        condition: product.condition,
        hostel: product.hostel,
        images: product.images,
      })
      .onConflictDoNothing({ target: schema.products.slug });
  }

  console.log("Seeding a review...");

  const secondPasswordHash = await hashPassword("demo12345");

  await db
    .insert(schema.users)
    .values({
      name: "Second Demo Student",
      username: "demo_student_2",
      email: "demo2@ikgptu.ac.in",
      passwordHash: secondPasswordHash,
      hostel: "Block A",
      branch: "ECE",
    })
    .onConflictDoNothing({ target: schema.users.email });

  const [secondUser] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, "demo2@ikgptu.ac.in"))
    .limit(1);

  const [mathsBook] = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.slug, "engineering-mathematics-vol-2"))
    .limit(1);

  if (mathsBook) {
    await db
      .insert(schema.reviews)
      .values({
        productId: mathsBook.id,
        userId: secondUser.id,
        rating: 5,
        description: "Exactly as described, saved me a lot of money.",
      })
      .onConflictDoNothing({
        target: [schema.reviews.orderId, schema.reviews.userId],
      });
  }

  console.log("Seed complete.");
  await client.end();
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
