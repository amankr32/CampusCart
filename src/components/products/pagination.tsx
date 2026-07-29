import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function ProductPagination({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (totalPages <= 1) return null;

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page" || value === undefined) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else {
        params.set(key, value);
      }
    }
    params.set("page", String(page));
    return `/browse?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <PageLink
        href={buildHref(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </PageLink>

      <span className="text-sm text-black/60 px-3">
        Page {currentPage} of {totalPages}
      </span>

      <PageLink
        href={buildHref(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </PageLink>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  children,
  ...props
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
  "aria-label": string;
}) {
  if (disabled) {
    return (
      <span
        className="flex items-center justify-center h-9 w-9 rounded-lg border border-[var(--border-subtle)] text-black/20"
        aria-hidden
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-center h-9 w-9 rounded-lg border border-[var(--border-subtle)] bg-white hover:border-[var(--brand-orange)] hover:text-[var(--brand-orange)] transition-colors"
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
