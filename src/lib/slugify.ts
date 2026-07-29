export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Appends a short random suffix to reduce collision odds without a DB round trip. */
export function slugifyWithSuffix(input: string): string {
  const base = slugify(input);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}
