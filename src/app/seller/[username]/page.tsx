import { db } from "@/db";
import { users, tenants, products, reviews } from "@/db/schema";
import { eq, and, avg, count, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Star,
  Package,
  MessageSquare,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTrustScoreBadge } from "@/lib/trust-score-client";

export default async function PublicSellerProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const resolvedParams = await params;
  const username = resolvedParams.username.toLowerCase();

  // Find user by username or ID
  const [seller] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      branch: users.branch,
      yearSemester: users.yearSemester,
      studentStatus: users.studentStatus,
      trustScore: users.trustScore,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!seller) {
    notFound();
  }

  // Fetch seller's storefront
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.ownerId, seller.id))
    .limit(1);

  // Fetch seller active listings
  let activeListings: (typeof products.$inferSelect)[] = [];
  if (tenant) {
    activeListings = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.tenantId, tenant.id),
          eq(products.status, "available"),
          eq(products.isArchived, false)
        )
      )
      .orderBy(desc(products.createdAt));
  }

  // Fetch rating summary
  const [ratingRes] = await db
    .select({
      avgRating: avg(reviews.rating),
      totalReviews: count(),
    })
    .from(reviews)
    .where(eq(reviews.revieweeId, seller.id));

  const averageRating = Number(ratingRes?.avgRating ?? 0);
  const totalReviews = Number(ratingRes?.totalReviews ?? 0);

  const trustBadge = getTrustScoreBadge(seller.trustScore, seller.studentStatus);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Seller Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-3xl overflow-hidden border-4 border-white shadow-md shrink-0">
            {seller.avatarUrl ? (
              <img src={seller.avatarUrl} alt={seller.name} className="w-full h-full object-cover" />
            ) : (
              seller.name.slice(0, 2).toUpperCase()
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold font-display text-slate-900">{seller.name}</h1>
                <p className="text-xs text-slate-500 font-mono">@{seller.username}</p>
              </div>

              {activeListings.length > 0 && (
                <Link href={`/product/${activeListings[0].slug}`}>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs gap-1.5 shadow-md shadow-indigo-100">
                    <MessageSquare className="w-4 h-4" /> Message Seller
                  </Button>
                </Link>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {seller.studentStatus === "verified" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Student Seller
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  <ShieldAlert className="w-4 h-4 text-slate-400" /> Unverified Seller
                </span>
              )}

              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${trustBadge.colorClass}`}>
                Trust Level: {trustBadge.level} ({seller.trustScore}/100)
              </span>
            </div>

            {seller.bio && (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">{seller.bio}</p>
            )}

            <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                {totalReviews > 0 ? `${averageRating.toFixed(1)} (${totalReviews} reviews)` : "No ratings yet"}
              </span>
              <span>•</span>
              <span>Joined {new Date(seller.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</span>
              {seller.branch && (
                <>
                  <span>•</span>
                  <span>{seller.branch}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Seller Listings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" /> Active Listings ({activeListings.length})
          </h2>
        </div>

        {activeListings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
            <Tag className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Active Listings</h3>
            <p className="text-xs text-slate-500">This seller currently has no active items for sale.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeListings.map((item) => {
              const images = Array.isArray(item.images) ? (item.images as string[]) : [];
              const primaryImg = images[0] || "/placeholder-item.jpg";
              const priceRs = Math.round(item.priceCents / 100);

              return (
                <Link
                  key={item.id}
                  href={`/product/${item.slug}`}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all group"
                >
                  <div className="h-48 w-full bg-slate-100 relative overflow-hidden">
                    <img
                      src={primaryImg}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-indigo-600 text-white font-bold text-sm px-3 py-1 rounded-full shadow-md">
                      ₹{priceRs}
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
                      <span className="capitalize">{item.condition.replace("_", " ")}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
