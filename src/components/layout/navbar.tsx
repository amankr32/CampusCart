"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  ShoppingBag,
  Search,
  TravelExplore,
  Plus,
  MessageSquare,
  Package,
  Store,
  Heart,
  User,
  ShieldCheck,
  ShieldAlert,
  Settings,
  LogOut,
  ChevronDown,
  X,
  Menu,
} from "@/components/ui/material-symbol";

import { Button } from "@/components/ui/button";
import { subscribeToUnreadCount } from "@/lib/unread-store";
import { openCommandPalette } from "@/lib/command-palette";

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

  const studentStatus = session?.user?.studentStatus || "unverified";
  const isAdmin = session?.user?.isAdmin;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Subscribe to deduplicated shared unread count
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

  // Keyboard shortcut Ctrl+K / Cmd+K for command palette
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openCommandPalette();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    setIsMenuOpen(false);
    router.push(`/browse?${params.toString()}`);
  };

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 bg-[var(--card-bg)]/95 backdrop-blur-md border-b border-[var(--border-subtle)] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4 lg:gap-8">
          
          {/* 1. BRAND LOGO (Left) */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-indigo-600 text-white shadow-xs group-hover:bg-indigo-700 transition-colors">
              <ShoppingBag className="h-5 w-5" strokeWidth={2} />
            </span>
            <div className="flex flex-col leading-none">
              <span className="font-display font-extrabold text-xl tracking-tight text-[var(--text-primary)]">
                Campus<span className="text-indigo-600">Cart</span>
              </span>
              <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-wider uppercase mt-0.5">
                IKGPTU Market
              </span>
            </div>
          </Link>

          {/* 2. SPACIOUS SEARCH BAR (Center - Flipkart/Amazon Style) */}
          <form
            onSubmit={handleSearch}
            className="hidden sm:flex items-center flex-1 max-w-xl xl:max-w-2xl relative h-10 rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] focus-within:border-indigo-600 focus-within:bg-[var(--card-bg)] shadow-2xs transition-all"
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-[var(--text-muted)]" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for textbooks, calculators (fx-991), drafters, cycles..."
              className="w-full bg-transparent pl-10 pr-20 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/70 focus:outline-hidden"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <kbd
              onClick={() => openCommandPalette(search)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-muted)] bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded shadow-2xs cursor-pointer hover:border-indigo-500/50"
              title="Command Palette (⌘K)"
            >
              <span>⌘K</span>
            </kbd>
          </form>

          {/* 3. CLEAN, UNCONGESTED ACTIONS (Right) */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
            
            {/* Browse Marketplace */}
            <Link
              href="/browse"
              prefetch={true}
              className={`hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all ${
                isActive("/browse")
                  ? "text-indigo-600 bg-indigo-500/10"
                  : "text-[var(--text-primary)] hover:text-indigo-600 hover:bg-[var(--border-subtle)]/40"
              }`}
            >
              <TravelExplore className="h-4.5 w-4.5" />
              <span>Browse</span>
            </Link>

            {/* + Sell Item (Flipkart's 'Become a Seller' style) */}
            <Link href="/sell" prefetch={true}>
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 sm:px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Sell</span>
              </Button>
            </Link>

            {status === "loading" ? (
              <div className="h-9 w-20 rounded-xl bg-[var(--border-subtle)]/40 animate-pulse" />
            ) : session?.user ? (
              <>
                {/* Chats / Messages */}
                <Link
                  href="/dashboard/messages"
                  prefetch={true}
                  className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all relative ${
                    isActive("/dashboard/messages")
                      ? "text-indigo-600 bg-indigo-500/10"
                      : "text-[var(--text-primary)] hover:text-indigo-600 hover:bg-[var(--border-subtle)]/40"
                  }`}
                >
                  <MessageSquare className="h-4.5 w-4.5" />
                  <span>Chats</span>
                  {unreadCount > 0 && (
                    <span className="flex items-center justify-center h-4.5 min-w-4.5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold shadow-xs">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Account Menu Dropdown (Houses Profile, Orders, Listings & Settings) */}
                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen((v) => !v)}
                    className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] hover:border-indigo-500/40 hover:bg-[var(--border-subtle)]/30 transition-all cursor-pointer"
                    aria-label="User Account Menu"
                  >
                    <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-indigo-600 text-white font-bold text-xs shrink-0">
                      {session.user.name?.slice(0, 2).toUpperCase() || "US"}
                    </span>
                    <span className="text-xs font-semibold text-[var(--text-primary)] hidden md:inline max-w-[90px] truncate">
                      {session.user.name?.split(" ")[0]}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  </button>

                  {/* Clean Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] shadow-xl py-2 z-50 divide-y divide-[var(--border-subtle)]/60 animate-in fade-in zoom-in-95 duration-100">
                      {/* User Header */}
                      <div className="px-4 py-3">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">{session.user.name}</p>
                        <p className="text-[11px] text-[var(--text-muted)] truncate">{session.user.email}</p>
                        <div className="mt-2 flex items-center gap-1.5">
                          {studentStatus === "verified" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <ShieldCheck className="w-3 h-3" /> Verified Student
                            </span>
                          ) : (
                            <Link
                              href="/student-verification"
                              onClick={() => setIsProfileOpen(false)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                            >
                              <ShieldAlert className="w-3 h-3" /> Unverified Seller
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Organized Account Links */}
                      <div className="py-1.5">
                        <Link
                          href="/orders"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--border-subtle)]/40 hover:text-indigo-600 transition-colors"
                        >
                          <Package className="w-4 h-4 text-[var(--text-muted)]" />
                          <span>My Orders &amp; Purchases</span>
                        </Link>

                        <Link
                          href="/dashboard/my-listings"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--border-subtle)]/40 hover:text-indigo-600 transition-colors"
                        >
                          <Store className="w-4 h-4 text-[var(--text-muted)]" />
                          <span>My Listings</span>
                        </Link>

                        <Link
                          href="/dashboard/messages"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex sm:hidden items-center justify-between px-4 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--border-subtle)]/40 hover:text-indigo-600 transition-colors"
                        >
                          <span className="flex items-center gap-2.5">
                            <MessageSquare className="w-4 h-4 text-[var(--text-muted)]" />
                            <span>Messages &amp; Chats</span>
                          </span>
                          {unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                              {unreadCount}
                            </span>
                          )}
                        </Link>

                        <Link
                          href="/browse?saved=true"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--border-subtle)]/40 hover:text-indigo-600 transition-colors"
                        >
                          <Heart className="w-4 h-4 text-[var(--text-muted)]" />
                          <span>Wishlist &amp; Saved</span>
                        </Link>

                        <Link
                          href="/student-verification"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--border-subtle)]/40 hover:text-indigo-600 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-[var(--text-muted)]" />
                          <span>Student Verification</span>
                        </Link>

                        <Link
                          href="/profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--border-subtle)]/40 hover:text-indigo-600 transition-colors"
                        >
                          <User className="w-4 h-4 text-[var(--text-muted)]" />
                          <span>Profile &amp; Settings</span>
                        </Link>

                        {isAdmin && (
                          <Link
                            href="/admin/verifications"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-500/10 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4 text-indigo-600" />
                            <span>Admin Verification Desk</span>
                          </Link>
                        )}
                      </div>

                      {/* Sign Out */}
                      <div className="py-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            signOut({ callbackUrl: "/" });
                          }}
                          className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Sign out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm" className="text-xs font-semibold rounded-xl text-[var(--text-primary)] hover:text-indigo-600">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-xs">
                    Join
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMenuOpen((v) => !v)}
              className="flex md:hidden items-center justify-center h-9 w-9 rounded-xl text-[var(--text-muted)] hover:bg-[var(--border-subtle)]/50 transition-colors"
              aria-label="Toggle Navigation"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* 4. MOBILE NAVIGATION DRAWER */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-[var(--border-subtle)] py-4 space-y-4">
            {/* Mobile Search Bar */}
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search textbooks, cycles, calculators..."
                className="w-full h-10 rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] pl-10 pr-4 text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-indigo-600"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            </form>

            <div className="flex flex-col gap-1">
              <Link
                href="/browse"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 text-xs font-semibold py-2.5 px-3 rounded-xl hover:bg-[var(--border-subtle)]/40 transition-colors text-[var(--text-primary)]"
              >
                <TravelExplore className="h-4.5 w-4.5 text-indigo-600" />
                <span>Browse Marketplace</span>
              </Link>

              <Link
                href="/sell"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 text-xs font-bold py-2.5 px-3 rounded-xl bg-indigo-500/10 text-indigo-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Sell an Item</span>
              </Link>

              {session?.user && (
                <>
                  <Link
                    href="/dashboard/messages"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between text-xs font-semibold py-2.5 px-3 rounded-xl hover:bg-[var(--border-subtle)]/40 transition-colors text-[var(--text-primary)]"
                  >
                    <span className="flex items-center gap-2.5">
                      <MessageSquare className="h-4 w-4 text-[var(--text-muted)]" />
                      <span>Chats &amp; Messages</span>
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                        {unreadCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/orders"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 text-xs font-semibold py-2.5 px-3 rounded-xl hover:bg-[var(--border-subtle)]/40 transition-colors text-[var(--text-primary)]"
                  >
                    <Package className="h-4 w-4 text-[var(--text-muted)]" />
                    <span>My Orders</span>
                  </Link>

                  <Link
                    href="/dashboard/my-listings"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 text-xs font-semibold py-2.5 px-3 rounded-xl hover:bg-[var(--border-subtle)]/40 transition-colors text-[var(--text-primary)]"
                  >
                    <Store className="h-4 w-4 text-[var(--text-muted)]" />
                    <span>My Listings</span>
                  </Link>

                  <Link
                    href="/browse?saved=true"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 text-xs font-semibold py-2.5 px-3 rounded-xl hover:bg-[var(--border-subtle)]/40 transition-colors text-[var(--text-primary)]"
                  >
                    <Heart className="h-4 w-4 text-[var(--text-muted)]" />
                    <span>Saved Items</span>
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 text-xs font-semibold py-2.5 px-3 rounded-xl hover:bg-[var(--border-subtle)]/40 transition-colors text-[var(--text-primary)]"
                  >
                    <User className="h-4 w-4 text-[var(--text-muted)]" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    href="/student-verification"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 text-xs font-semibold py-2.5 px-3 rounded-xl hover:bg-emerald-500/10 text-emerald-600 transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Student Verification</span>
                  </Link>
                </>
              )}
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-col gap-2">
              {session?.user ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-rose-600 border-rose-500/30 hover:bg-rose-500/10 rounded-xl font-semibold cursor-pointer"
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                >
                  Sign out
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full rounded-xl font-semibold border-[var(--border-subtle)]">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>
                    <Button size="sm" className="w-full bg-indigo-600 text-white rounded-xl font-semibold">
                      Join
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
