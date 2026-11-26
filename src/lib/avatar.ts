/**
 * Builds avatar initials from a user's display name:
 * - Multi-word name: first letter of the first name + first letter of the last name (e.g. "Aman Kumar" -> "AK").
 * - Single name only: first letter of the first name (e.g. "Aman" -> "A").
 * - Empty/missing name: returns `fallback`.
 */
export function getAvatarInitials(
  name: string | null | undefined,
  fallback = "CC"
): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return fallback;
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  const firstChar = parts[0].charAt(0);
  const lastChar = parts[parts.length - 1].charAt(0);
  return `${firstChar}${lastChar}`.toUpperCase();
}
