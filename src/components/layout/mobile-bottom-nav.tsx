"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Compass,
  Search,
  Plus,
  MessageSquare,
  User,
  ShoppingBag,
} from "@/components/ui/material-symbol";

import { subscribeToUnreadCount } from "@/lib/unread-store";
import { openCommandPalette } from "@/lib/command-palette";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session?.user) {
      setUnreadCount(0);
      return;
    }

    const unsubscribe = subscribeToUnreadCount((count) => {
      setUnreadCount(count);
    });

    return unsubscribe;
  }, [session?.user?.id]);

  const isExploreActive = pathname === "/";
  const isSearchActive = pathname.startsWith("/browse");
  const isSellActive = pathname === "/sell";
  const isMessagesActive = pathname.startsWith("/dashboard/messages");
  const isProfileActive =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/student-verification") ||
    pathname.startsWith("/dashboard/my-listings") ||
    pathname.startsWith("/orders") ||
    (!session?.user && (pathname === "/sign-in" || pathname === "/sign-up"));

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--card-bg)]/95 backdrop-blur-md border-t border-[var(--border-subtle)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] select-none"
    >
      <div className="max-w-md mx-auto px-3 h-16 flex items-center justify-between">
        {/* 1. Explore */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            isExploreActive
              ? "text-[var(--brand-primary)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Compass
            className={`w-5 h-5 ${isExploreActive ? "stroke-[2.5]" : "stroke-[1.8]"}`}
          />
          <span
            className={`text-[10px] tracking-tight mt-0.5 ${
              isExploreActive ? "font-bold text-[var(--brand-primary)]" : "font-medium"
            }`}
          >
            Explore
          </span>
        </Link>

        {/* 2. Search (Trigger Command Palette or Browse) */}
        <button
          type="button"
          onClick={() => openCommandPalette()}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            isSearchActive
              ? "text-[var(--brand-primary)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Search
            className={`w-5 h-5 ${isSearchActive ? "stroke-[2.5]" : "stroke-[1.8]"}`}
          />
          <span
            className={`text-[10px] tracking-tight mt-0.5 ${
              isSearchActive ? "font-bold text-[var(--brand-primary)]" : "font-medium"
            }`}
          >
            Search
          </span>
        </button>

        {/* 3. Sell Item (Elevated Hero Button) */}
        <div className="flex flex-col items-center justify-center flex-1 relative -top-3">
          <Link
            href="/sell"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/35 border-4 border-[var(--card-bg)] active:scale-95 transition-all focus:outline-hidden"
            aria-label="Sell Item"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </Link>
          <span
            className={`text-[10px] tracking-tight mt-0.5 ${
              isSellActive
                ? "font-bold text-[var(--brand-primary)]"
                : "font-semibold text-[var(--text-primary)]"
            }`}
          >
            Sell
          </span>
        </div>

        {/* 4. Messages */}
        <Link
          href={session?.user ? "/dashboard/messages" : "/sign-in?callbackUrl=/dashboard/messages"}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors relative ${
            isMessagesActive
              ? "text-[var(--brand-primary)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <div className="relative">
            <MessageSquare
              className={`w-5 h-5 ${isMessagesActive ? "stroke-[2.5]" : "stroke-[1.8]"}`}
            />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-extrabold shadow-xs animate-in zoom-in-75">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] tracking-tight mt-0.5 ${
              isMessagesActive ? "font-bold text-[var(--brand-primary)]" : "font-medium"
            }`}
          >
            Messages
          </span>
        </Link>

        {/* 5. Profile */}
        <Link
          href={session?.user ? "/profile" : "/sign-in"}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            isProfileActive
              ? "text-[var(--brand-primary)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          {session?.user?.name ? (
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                isProfileActive
                  ? "bg-[var(--brand-primary)] text-white"
                  : "bg-[var(--border-subtle)] text-[var(--text-primary)]"
              }`}
            >
              {session.user.name.slice(0, 1).toUpperCase()}
            </span>
          ) : (
            <User
              className={`w-5 h-5 ${isProfileActive ? "stroke-[2.5]" : "stroke-[1.8]"}`}
            />
          )}
          <span
            className={`text-[10px] tracking-tight mt-0.5 ${
              isProfileActive ? "font-bold text-[var(--brand-primary)]" : "font-medium"
            }`}
          >
            {session?.user ? "Profile" : "Sign In"}
          </span>
        </Link>
      </div>
    </nav>
  );
}
