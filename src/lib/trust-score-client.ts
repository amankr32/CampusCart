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
