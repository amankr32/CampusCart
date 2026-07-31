import "server-only";
import { db } from "@/db";
import { users, orders, reviews, reports } from "@/db/schema";
import { eq, and, count, avg } from "drizzle-orm";

export interface TrustScoreDetails {
  score: number;
  label: string;
  badgeColor: string;
  isStudentVerified: boolean;
  isEmailVerified: boolean;
}

/**
 * Calculates a user's trust score dynamically based on verification status, sales, reviews, and reports
 */
export async function calculateUserTrustScore(userId: string): Promise<number> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return 0;

  let score = 0;

  // 1. Email Verification (+20 pts)
  if (user.emailVerifiedAt) {
    score += 20;
  }

  // 2. Student Verification (+30 pts)
  if (user.studentStatus === "verified") {
    score += 30;
  }

  // 3. Account Age (up to +20 pts)
  const ageDays = Math.floor(
    (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (ageDays >= 180) score += 20;
  else if (ageDays >= 90) score += 15;
  else if (ageDays >= 30) score += 10;
  else if (ageDays >= 7) score += 5;

  // 4. Completed Sales (+5 per sale, max +25 pts)
  const [salesResult] = await db
    .select({ totalSales: count() })
    .from(orders)
    .where(and(eq(orders.status, "completed")));
  const salesCount = Number(salesResult?.totalSales ?? 0);
  score += Math.min(25, salesCount * 5);

  // 5. Average Seller Rating (up to +15 pts)
  const [ratingResult] = await db
    .select({ avgRating: avg(reviews.rating) })
    .from(reviews)
    .where(eq(reviews.revieweeId, userId));
  const averageRating = Number(ratingResult?.avgRating ?? 0);
  if (averageRating >= 4.5) score += 15;
  else if (averageRating >= 4.0) score += 10;
  else if (averageRating >= 3.0) score += 5;

  // 6. Actioned Reports against user (-15 pts per report)
  const [reportsResult] = await db
    .select({ totalReports: count() })
    .from(reports)
    .where(and(eq(reports.targetId, userId), eq(reports.status, "actioned")));
  const reportCount = Number(reportsResult?.totalReports ?? 0);
  score = Math.max(0, score - reportCount * 15);

  const finalScore = Math.min(100, Math.max(0, score));

  // Sync to database if changed
  if (finalScore !== user.trustScore) {
    await db
      .update(users)
      .set({ trustScore: finalScore, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  return finalScore;
}

/**
 * Returns trust metadata (level name, badge styling) for a trust score
 */
export function getTrustScoreBadge(score: number, studentStatus: string = "unverified") {
  if (studentStatus === "verified" || score >= 80) {
    return {
      label: "Verified Student Seller",
      level: "Elite",
      colorClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
      icon: "ShieldCheck",
    };
  }
  if (score >= 50) {
    return {
      label: "Trusted Student",
      level: "High",
      colorClass: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
      icon: "Shield",
    };
  }
  if (score >= 20) {
    return {
      label: "Email Verified Seller",
      level: "Moderate",
      colorClass: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
      icon: "CheckCircle",
    };
  }
  return {
    label: "Unverified Seller",
    level: "Basic",
    colorClass: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400",
    icon: "AlertCircle",
  };
}
