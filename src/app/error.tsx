"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("UI_ERROR_BOUNDARY", "Uncaught UI rendering error", error);
  }, [error]);

  return (
    <div className="w-full max-w-[1600px] mx-auto flex-1 flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="font-display font-extrabold text-3xl text-[var(--text-primary)]">
        Something Went Wrong
      </h1>
      <p className="text-[var(--text-muted)] max-w-sm text-xs sm:text-sm leading-relaxed">
        That&apos;s on us, not you. Click try again to refresh the view or return home.
      </p>
      <div className="flex items-center gap-3 mt-4">
        <Button
          onClick={() => reset()}
          className="rounded-xl text-xs font-bold px-5 py-2.5 cursor-pointer"
        >
          Try Again
        </Button>
        <Link href="/">
          <Button variant="outline" className="rounded-xl text-xs font-bold px-5 py-2.5">
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

