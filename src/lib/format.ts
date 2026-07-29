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
