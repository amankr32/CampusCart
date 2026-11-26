import Link from "next/link";
import Image from "next/image";
import {
  ListOrdered,
  MessageSquare,
  Package,
  Plus,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  ImageOff,
  Star,
  Tag,
} from "@/components/ui/material-symbol";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantByOwnerId } from "@/db/queries/tenants";
import { getProductsByTenantId } from "@/db/queries/products";
import { listConversationsForUser } from "@/db/queries/messages";
import { getOrdersByBuyerId, getSalesByTenantId } from "@/db/queries/orders";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { getAvatarInitials } from "@/lib/avatar";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const userId = session.user.id;

  // Read latest live status from DB to reflect any admin verification approvals
  const [currentUser] = await db
    .select({
      studentStatus: users.studentStatus,
      trustScore: users.trustScore,
      name: users.name,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const userName = (currentUser?.name || session.user.name)?.split(" ")[0] || "Student";
  const studentStatus = currentUser?.studentStatus || session.user.studentStatus || "unverified";
  const trustScore = currentUser?.trustScore ?? session.user.trustScore ?? 20;

  // Fetch summary data
  const tenant = await getTenantByOwnerId(userId);
  const listings = tenant ? await getProductsByTenantId(tenant.id) : [];
  const conversations = await listConversationsForUser(userId);
  const buyerOrders = await getOrdersByBuyerId(userId);
  const sales = tenant ? await getSalesByTenantId(tenant.id) : [];

  const activeListings = listings.filter((p) => p.status === "available");
  const totalOrdersCount = buyerOrders.length + sales.length;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--card-bg)] p-4 sm:p-8 rounded-2xl border border-[var(--border-subtle)] shadow-xs">
        <div>
          <h1 className="font-display font-extrabold text-xl sm:text-3xl text-[var(--text-primary)] tracking-tight">
            Welcome back, {userName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Here&apos;s a live overview of your CampusCart activity, active listings, and messages.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/sell" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95">
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Sell Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Activity Cards (4 Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Listings */}
        <Link
          href="/dashboard/my-listings"
          className="p-3.5 sm:p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/50 hover:shadow-md transition-all group min-w-0"
        >
          <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider leading-tight">Active Listings</span>
            <span className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-colors shrink-0">
              <ListOrdered className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">{activeListings.length}</span>
            <span className="text-[11px] sm:text-xs font-semibold text-[var(--brand-primary)] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 sm:gap-1">
              Manage <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </Link>

        {/* Messages */}
        <Link
          href="/dashboard/messages"
          className="p-3.5 sm:p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/50 hover:shadow-md transition-all group min-w-0"
        >
          <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider leading-tight">Conversations</span>
            <span className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-colors shrink-0">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">{conversations.length}</span>
            <span className="text-[11px] sm:text-xs font-semibold text-[var(--brand-primary)] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 sm:gap-1">
              Inbox <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </Link>

        {/* Orders */}
        <Link
          href="/orders"
          className="p-3.5 sm:p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/50 hover:shadow-md transition-all group min-w-0"
        >
          <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider leading-tight">Total Orders</span>
            <span className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-colors shrink-0">
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">{totalOrdersCount}</span>
            <span className="text-[11px] sm:text-xs font-semibold text-[var(--brand-primary)] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 sm:gap-1">
              View <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </Link>

        {/* Student Verification / Trust */}
        <Link
          href="/student-verification"
          className="p-3.5 sm:p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/50 hover:shadow-md transition-all group min-w-0"
        >
          <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider leading-tight">Trust Score</span>
            <span className={`flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl shrink-0 ${
              studentStatus === "verified" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            }`}>
              {studentStatus === "verified" ? <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" /> : <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5" />}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">{trustScore} pts</span>
            <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
              studentStatus === "verified" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            }`}>
              {studentStatus === "verified" ? "Verified" : "Verify"}
            </span>
          </div>
        </Link>
      </div>

      {/* Unverified Seller Alert */}
      {studentStatus !== "verified" && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-700 font-display">Unverified Seller Limits</h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                Unverified sellers can list up to 2 items max. Get Student Verified using your PTU Portal to unlock unlimited listings and higher search ranking!
              </p>
            </div>
          </div>
          <Link href="/student-verification" className="shrink-0">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold px-4 py-2 cursor-pointer">
              Verify Student Identity
            </Button>
          </Link>
        </div>
      )}

      {/* Recent Activity Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Listings */}
        <div className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-[var(--text-primary)]">Recent Listings</h2>
            <Link href="/dashboard/my-listings" className="text-xs font-bold text-[var(--brand-primary)] hover:underline flex items-center gap-1">
              View All ({listings.length}) <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-[var(--border-subtle)] rounded-xl p-4">
              <p className="text-xs text-[var(--text-muted)]">No listings yet — post your unused books or gadgets!</p>
              <Link href="/sell" className="inline-block mt-3">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-xl font-bold cursor-pointer">
                  + Create Listing
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-subtle)]/70 hover:border-[var(--brand-primary)]/50 transition-colors">
                  <div className="relative h-12 w-12 rounded-lg bg-[var(--border-subtle)]/40 border border-[var(--border-subtle)] overflow-hidden shrink-0">
                    {item.images?.[0] ? (
                      <Image src={item.images[0]} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                        <ImageOff className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">{item.name}</p>
                    <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">{formatPrice(item.priceCents)}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    item.status === "available" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-600"
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Conversations */}
        <div className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-[var(--text-primary)]">Recent Messages</h2>
            <Link href="/dashboard/messages" className="text-xs font-bold text-[var(--brand-primary)] hover:underline flex items-center gap-1">
              View Inbox ({conversations.length}) <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {conversations.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-[var(--border-subtle)] rounded-xl p-4">
              <p className="text-xs text-[var(--text-muted)]">No active chat conversations yet.</p>
              <Link href="/browse" className="inline-block mt-3 text-xs font-bold text-[var(--brand-primary)] hover:underline">
                Browse Marketplace →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.slice(0, 3).map((chat) => (
                <Link
                  key={chat.id}
                  href={`/dashboard/messages/${chat.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-subtle)]/70 hover:bg-[var(--border-subtle)]/40 transition-colors"
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)] font-bold text-xs shrink-0">
                    {getAvatarInitials(chat.otherUser?.name, "US")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">{chat.otherUser?.name}</p>
                      <span className="text-[10px] text-[var(--text-muted)] font-medium">Chat</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">{chat.product.name} · {formatPrice(chat.product.priceCents)}</p>
                  </div>
                  {chat.unreadCount > 0 && (
                    <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
