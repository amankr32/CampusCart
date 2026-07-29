import Link from "next/link";
import { PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <PackageSearch className="h-12 w-12 text-black/30" />
      <h1 className="font-display font-bold text-3xl">Page not found</h1>
      <p className="text-black/60 max-w-sm">
        Whatever you&apos;re looking for isn&apos;t here — it may have been
        sold, unpublished, or the link might be off.
      </p>
      <div className="flex gap-3 mt-2">
        <Link href="/browse">
          <Button variant="brand">Browse listings</Button>
        </Link>
        <Link href="/">
          <Button variant="elevated">Go home</Button>
        </Link>
      </div>
    </div>
  );
}
