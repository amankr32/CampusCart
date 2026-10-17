"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { MessageCircle } from "@/components/ui/material-symbol";

import { subscribeToUnreadCount } from "@/lib/unread-store";

export function MessagesNavLink({ onClick }: { onClick?: () => void }) {
  const { data: session } = useSession();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!session?.user) {
      setCount(0);
      return;
    }

    const unsubscribe = subscribeToUnreadCount((newCount) => {
      setCount(newCount);
    });

    return unsubscribe;
  }, [session?.user?.id]);

  if (!session?.user) return null;

  return (
    <Link
      href="/dashboard/messages"
      onClick={onClick}
      className="relative flex items-center justify-center h-9 w-9 rounded-md hover:bg-black/5 transition-colors shrink-0"
      aria-label="Messages"
    >
      <MessageCircle className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-[var(--brand-orange)] text-white text-[10px] font-medium">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
