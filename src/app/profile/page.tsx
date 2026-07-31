import { auth } from "@/auth";
import { db } from "@/db";
import { users, tenants, products, orders, reviews } from "@/db/schema";
import { eq, and, count, avg } from "drizzle-orm";
import { redirect } from "next/navigation";
import { UserProfileClient } from "@/components/profile/user-profile-client";
import { calculateUserTrustScore } from "@/lib/trust-score";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/profile");
  }

  // Calculate updated trust score
  const trustScore = await calculateUserTrustScore(session.user.id);

  // Fetch full user record
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch user tenant/store
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.ownerId, user.id))
    .limit(1);

  // Fetch listing statistics
  let activeListingsCount = 0;
  if (tenant) {
    const [listingsRes] = await db
      .select({ total: count() })
      .from(products)
      .where(eq(products.tenantId, tenant.id));
    activeListingsCount = Number(listingsRes?.total ?? 0);
  }

  // Fetch sales count
  const [salesRes] = await db
    .select({ totalSales: count() })
    .from(orders)
    .where(and(eq(orders.status, "completed")));
  const totalSalesCount = Number(salesRes?.totalSales ?? 0);

  // Fetch average rating
  const [ratingRes] = await db
    .select({ avgRating: avg(reviews.rating) })
    .from(reviews)
    .where(eq(reviews.revieweeId, user.id));
  const averageRating = Number(ratingRes?.avgRating ?? 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <UserProfileClient
        user={{
          ...user,
          trustScore,
        }}
        stats={{
          activeListingsCount,
          totalSalesCount,
          averageRating,
        }}
      />
    </div>
  );
}
