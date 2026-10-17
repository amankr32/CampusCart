import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Zap,
  Handshake,
  Store,
  Star,
  ExternalLink,
} from "@/components/ui/material-symbol";
import { getTrustScoreBadge } from "@/lib/trust-score";

interface SellerTrustCardProps {
  seller: {
    id: string;
    name: string;
    username: string;
    studentStatus: "unverified" | "pending" | "verified" | "rejected";
    trustScore: number;
    avatarUrl?: string | null;
    branch?: string | null;
  };
  storeName: string;
  storeSlug: string;
  completedSales: number;
}

export function SellerTrustCard({
  seller,
  storeName,
  storeSlug,
  completedSales,
}: SellerTrustCardProps) {
  const isVerified = seller.studentStatus === "verified";
  const trustBadge = getTrustScoreBadge(seller.trustScore, seller.studentStatus);
  const initials = seller.name
    ? seller.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "ST";

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-4 sm:p-5 space-y-4 shadow-2xs">
      {/* Header: Avatar, Name, Verification Ribbon */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-xs shrink-0">
            {initials}
          </div>

          <div className="min-w-0">
            <Link
              href={`/store/${storeSlug}`}
              className="group inline-flex items-center gap-1.5 font-bold text-sm text-[var(--text-primary)] hover:text-[var(--brand-primary)] transition-colors truncate"
            >
              <span className="truncate">{storeName}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0" />
            </Link>
            <p className="text-[11px] text-[var(--text-muted)] truncate">
              {seller.branch || "IKGPTU Campus Student"}
            </p>
          </div>
        </div>

        {/* Verification Status Pill */}
        {isVerified ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
            <ShieldAlert className="w-3.5 h-3.5" />
            Unverified
          </span>
        )}
      </div>

      {/* Trust & Performance Metrics */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--border-subtle)]/60 text-xs">
        {/* Trust Score */}
        <div className="p-2.5 rounded-xl bg-[var(--border-subtle)]/30 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Trust Score</span>
            <span className="font-bold text-[var(--brand-primary)]">
              {seller.trustScore}/100
            </span>
          </div>
          <div className="flex items-center gap-1 font-bold text-[var(--text-primary)] text-xs truncate">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
            <span className="truncate">{trustBadge.level} Seller</span>
          </div>
        </div>

        {/* Handoff Count */}
        <div className="p-2.5 rounded-xl bg-[var(--border-subtle)]/30 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Campus Handoffs
          </div>
          <div className="flex items-center gap-1 font-bold text-[var(--text-primary)] text-xs truncate">
            <Handshake className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">
              {completedSales > 0 ? `${completedSales} deals closed` : "New seller"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Response Metric */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--brand-primary-light)]/40 border border-[var(--brand-primary)]/15 text-[11px] text-[var(--text-primary)]">
        <Zap className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0" />
        <span className="font-medium">Typically replies within 15 minutes</span>
      </div>
    </div>
  );
}
