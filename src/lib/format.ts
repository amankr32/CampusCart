const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** priceCents is stored in paise (1 rupee = 100 paise) for precise integer math. */
export function formatPrice(priceCents: number): string {
  return inrFormatter.format(priceCents / 100);
}

export const CONDITION_LABELS: Record<string, string> = {
  new: "Brand new",
  like_new: "Like new",
  good: "Good",
  fair: "Fair",
  worn: "Well used",
};

export function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
