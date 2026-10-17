import { describe, it, expect } from "vitest";
import { getTrustScoreBadge } from "@/lib/trust-score-client";

describe("Trust Score Calculation & Badge Rules", () => {
  describe("getTrustScoreBadge", () => {
    it("grants Elite Verified Student badge if studentStatus is verified regardless of numerical score", () => {
      const badge = getTrustScoreBadge(25, "verified");
      expect(badge.level).toBe("Elite");
      expect(badge.label).toBe("Verified Student Seller");
      expect(badge.icon).toBe("ShieldCheck");
    });

    it("grants Elite badge if numerical score is >= 80 even if unverified", () => {
      const badge = getTrustScoreBadge(85, "unverified");
      expect(badge.level).toBe("Elite");
      expect(badge.label).toBe("Verified Student Seller");
    });

    it("grants High Trusted Student badge for scores between 50 and 79", () => {
      const badge50 = getTrustScoreBadge(50, "unverified");
      expect(badge50.level).toBe("High");
      expect(badge50.label).toBe("Trusted Student");
      expect(badge50.icon).toBe("Shield");

      const badge79 = getTrustScoreBadge(79, "unverified");
      expect(badge79.level).toBe("High");
    });

    it("grants Moderate Email Verified badge for scores between 20 and 49", () => {
      const badge20 = getTrustScoreBadge(20, "unverified");
      expect(badge20.level).toBe("Moderate");
      expect(badge20.label).toBe("Email Verified Seller");
      expect(badge20.icon).toBe("CheckCircle");

      const badge49 = getTrustScoreBadge(49, "unverified");
      expect(badge49.level).toBe("Moderate");
    });

    it("assigns Basic Unverified Seller badge for scores below 20", () => {
      const badge = getTrustScoreBadge(15, "unverified");
      expect(badge.level).toBe("Basic");
      expect(badge.label).toBe("Unverified Seller");
      expect(badge.icon).toBe("AlertCircle");
    });
  });

  describe("Trust Score Scoring Formula Mechanics", () => {
    // Pure calculation model testing the weighted component algorithms
    function calculatePureScore({
      isEmailVerified,
      isStudentVerified,
      ageDays,
      completedSales,
      avgRating,
      actionedReports,
    }: {
      isEmailVerified: boolean;
      isStudentVerified: boolean;
      ageDays: number;
      completedSales: number;
      avgRating: number;
      actionedReports: number;
    }) {
      let score = 0;
      if (isEmailVerified) score += 20;
      if (isStudentVerified) score += 30;

      if (ageDays >= 180) score += 20;
      else if (ageDays >= 90) score += 15;
      else if (ageDays >= 30) score += 10;
      else if (ageDays >= 7) score += 5;

      score += Math.min(25, completedSales * 5);

      if (avgRating >= 4.5) score += 15;
      else if (avgRating >= 4.0) score += 10;
      else if (avgRating >= 3.0) score += 5;

      score = Math.max(0, score - actionedReports * 15);
      return Math.min(100, Math.max(0, score));
    }

    it("calculates default starting score for brand new email-verified user", () => {
      const score = calculatePureScore({
        isEmailVerified: true,
        isStudentVerified: false,
        ageDays: 1,
        completedSales: 0,
        avgRating: 0,
        actionedReports: 0,
      });

      expect(score).toBe(20);
    });

    it("calculates score for active student with sales and 5-star ratings", () => {
      const score = calculatePureScore({
        isEmailVerified: true,
        isStudentVerified: true,
        ageDays: 100, // +15
        completedSales: 4, // +20
        avgRating: 4.8, // +15
        actionedReports: 0,
      });

      // 20 + 30 + 15 + 20 + 15 = 100
      expect(score).toBe(100);
    });

    it("applies penalty for actioned reports and clamps minimum score to 0", () => {
      const score = calculatePureScore({
        isEmailVerified: true,
        isStudentVerified: false,
        ageDays: 0,
        completedSales: 0,
        avgRating: 0,
        actionedReports: 3, // -45
      });

      // 20 - 45 = -25 -> clamped to 0
      expect(score).toBe(0);
    });
  });
});
