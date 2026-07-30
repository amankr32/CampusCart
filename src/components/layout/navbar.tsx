"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Bell,
  ChevronDown,
  Info,
  LayoutGrid,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingCart,
  Tag,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const navLinks = [
  { href: "/browse", label: "Browse", icon: LayoutGrid },
  { href: "/sell", label: "Sell", icon: Tag },
  { href: "/how-it-works", label: "How it works", icon: Info },
];

const UNREAD_POLL_INTERVAL_MS = 15_000;

export function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isProfileOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isProfileOpen]);

  // Real unread-message count, reused here as the navbar's "notifications"
  // signal — there's no separate notifications table/feature in the schema,
  // so this stays honest rather than showing a fake hardcoded badge.
  useEffect(() => {
    if (!session?.user) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch("/api/messages/unread-count");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setUnreadCount(data.count ?? 0);
      } catch {
        // Silently ignore — the badge just won't update this cycle.
      }
    };

    poll();
    const interval = setInterval(poll, UNREAD_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session?.user]);

  // Cmd/Ctrl+K focuses the search box, matching the ⌘K hint shown in it.
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    setIsMenuOpen(false);
    router.push(`/browse?${params.toString()}`);
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4 bg-[var(--background)]">
      <nav className="rounded-3xl border border-black/5 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <div className="h-[72px] w-full flex items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="flex items-center justify-center h-9 w-9 rounded-xl bg-blue-600 text-white">
              <ShoppingCart className="h-4.5 w-4.5" strokeWidth={2} />
            </span>
            <span className="font-display font-bold text-lg tracking-tight hidden sm:inline">
              CampusCart
            </span>
          </Link>

          <form
            onSubmit={handleSearch}
            className="hidden md:flex w-full max-w-md relative"
          >
            <Input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for items, categories or users..."
              className="h-10 rounded-full bg-black/[0.03] border-black/5 pl-10 pr-12"
            />
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-black/35" />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 min-w-5 px-1 rounded border border-[var(--border-subtle)] bg-black/[0.03] text-[10px] font-medium text-black/40">
              ⌘K
            </span>
          </form>

          <div className="hidden lg:flex items-center gap-1 shrink-0">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    active
                      ? "text-blue-600 border-blue-600"
                      : "text-black/70 border-transparent hover:text-blue-600"
                  }`}
                >
                  <link.icon className="h-4 w-4" strokeWidth={active ? 2.25 : 1.75} />
                  {link.label}
                </Link>
              );
            })}
            {session?.user && (
              <Link
                href="/orders"
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive("/orders")
                    ? "text-blue-600 border-blue-600"
                    : "text-black/70 border-transparent hover:text-blue-600"
                }`}
              >
                <Package
                  className="h-4 w-4"
                  strokeWidth={isActive("/orders") ? 2.25 : 1.75}
                />
                Orders
              </Link>
            )}
          </div>

          <div className="flex-1" />

          {session?.user && (
            <>
              <div className="hidden lg:block h-6 w-px bg-black/10 shrink-0" />
              <Link
                href="/dashboard/messages"
                className="relative hidden sm:flex items-center justify-center h-9 w-9 rounded-lg hover:bg-black/5 transition-colors shrink-0"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-black/60" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
                )}
              </Link>
            </>
          )}

          {/* Desktop auth actions */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {status === "loading" ? (
              <div className="h-9 w-24 rounded-lg bg-black/5 animate-pulse" />
            ) : session?.user ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((v) => !v)}
                  className="flex items-center gap-1 pl-1 pr-1 h-9 rounded-lg hover:bg-black/5 transition-colors"
                >
                  <span className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-display font-semibold text-xs shrink-0">
                    {session.user.username?.slice(0, 2).toUpperCase()}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-black/40" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 rounded-lg border border-[var(--border-subtle)] bg-white shadow-[var(--shadow-card-hover)] py-1.5 z-50">
                    <Link
                      href="/dashboard"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-3 py-2 text-sm hover:bg-black/[0.03] transition-colors"
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-black/[0.03] transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 rounded-full">
                    Join CampusCart
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle - the only way to reach nav links, search,
              and auth actions below the lg breakpoint */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="flex lg:hidden items-center justify-center h-9 w-9 rounded-md hover:bg-black/5 transition-colors shrink-0"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden border-t border-[var(--border-subtle)] bg-white px-4 py-4 flex flex-col gap-4 rounded-b-3xl">
            <form onSubmit={handleSearch} className="flex md:hidden">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for items, categories or users..."
                className="h-9"
              />
              <Button type="submit" variant="ghost" size="icon" className="h-9 w-9 -ml-9">
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 text-sm font-medium py-2 hover:opacity-70 transition-opacity"
                >
                  <link.icon className="h-4 w-4" strokeWidth={1.75} />
                  {link.label}
                </Link>
              ))}
              {session?.user && (
                <>
                  <Link
                    href="/orders"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 text-sm font-medium py-2 hover:opacity-70 transition-opacity"
                  >
                    <Package className="h-4 w-4" strokeWidth={1.75} />
                    Orders
                  </Link>
                  <Link
                    href="/dashboard/messages"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 text-sm font-medium py-2 hover:opacity-70 transition-opacity"
                  >
                    Notifications
                    {unreadCount > 0 && (
                      <span className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-medium">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Link>
                </>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-black/10">
              {status === "loading" ? (
                <div className="h-9 w-full rounded-md bg-black/5 animate-pulse" />
              ) : session?.user ? (
                <>
                  <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full">
                      {session.user.username}
                    </Button>
                  </Link>
                  <Button
                    variant="elevated"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setIsMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>
                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                      Join CampusCart
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}