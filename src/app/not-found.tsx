import Link from "next/link";
import { PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="w-full max-w-[1600px] mx-auto flex-1 flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <div className="w-16 h-16 rounded-3xl bg-[var(--brand-primary-light)] border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] flex items-center justify-center">
        <PackageSearch className="h-8 w-8" />
      </div>
      <h1 className="font-display font-extrabold text-3xl text-[var(--text-primary)]">Page Not Found</h1>
      <p className="text-[var(--text-muted)] max-w-sm text-xs sm:text-sm leading-relaxed">
        Whatever you&apos;re looking for isn&apos;t here — it may have been sold, unpublished, or the link might be off.
      </p>
      <div className="flex items-center gap-3 mt-4">
        <Link href="/browse">
          <Button className="rounded-xl text-xs font-bold px-5 py-2.5">
            Browse Marketplace →
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" className="rounded-xl text-xs font-bold px-5 py-2.5">
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

