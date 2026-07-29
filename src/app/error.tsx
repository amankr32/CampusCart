"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <AlertTriangle className="h-12 w-12 text-black/30" />
      <h1 className="font-display font-bold text-3xl">
        Something went wrong
      </h1>
      <p className="text-black/60 max-w-sm">
        That&apos;s on us, not you. Try again, and if it keeps happening,
        let us know through the contact page.
      </p>
      <div className="flex gap-3 mt-2">
        <Button variant="brand" onClick={() => reset()}>
          Try again
        </Button>
        <Link href="/">
          <Button variant="elevated">Go home</Button>
        </Link>
      </div>
    </div>
  );
}
