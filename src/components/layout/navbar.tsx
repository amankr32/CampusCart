"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Bell,
  ChevronDown,
  Compass,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Receipt,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Store,
  User,
  Heart,
  X,
  CheckCircle2,
} from "@/components/ui/material-symbol";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeToUnreadCount } from "@/lib/unread-store";
import { openCommandPalette } from "@/lib/command-palette";

export function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const studentStatus = session?.user?.studentStatus || "unverified";
  const isAdmin = session?.user?.isAdmin;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
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
        <div className="h-16 flex items-center justify-between gap-3">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20 group-hover:from-indigo-700 group-hover:to-indigo-600 transition-all">
              <ShoppingBag className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="font-display font-bold text-xl tracking-tight text-[var(--text-primary)]">
              Campus<span className="text-[var(--brand-primary)]">Cart</span>
            </span>
          </Link>

          {/* Search Trigger Pill (Desktop/Tablet) */}
          <button
            type="button"
            onClick={() => openCommandPalette()}
            className="hidden sm:flex items-center flex-1 max-w-xs xl:max-w-md relative mx-3 h-9.5 rounded-full bg-[var(--input-bg)] border border-[var(--border-subtle)] pl-9 pr-3 text-xs text-[var(--text-muted)] hover:border-[var(--brand-primary)]/50 focus:outline-hidden transition-all shadow-2xs group cursor-pointer text-left"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors" />
            <span className="truncate">Search products, textbooks, hostel gear...</span>
            <kbd className="ml-auto pointer-events-none hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-muted)] bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded shadow-2xs">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          </button>

          {/* Primary Top Navigation Links (Desktop & Laptop) */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Browse */}
            <Link
              href="/browse"
              prefetch={true}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                isActive("/browse")
                  ? "text-[var(--brand-primary)] bg-[var(--brand-primary-light)]"
                  : "text-[var(--text-primary)] hover:text-[var(--brand-primary)] hover:bg-[var(--border-subtle)]/40"
              }`}
            >
              <Compass className="h-4 w-4" strokeWidth={2} />
              Browse
            </Link>

            {/* + Sell Item (Elevated Primary CTA Button) */}
            <Link href="/sell" prefetch={true} className="mx-1">
              <Button
                size="sm"
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md shadow-indigo-500/25 flex items-center gap-1.5 transition-all hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                Sell Item
              </Button>
            </Link>

            {session?.user && (
              <>
                {/* Messages (Core Feature) */}
                <Link
                  href="/dashboard/messages"
                  prefetch={true}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all relative ${
                    isActive("/dashboard/messages")
                      ? "text-[var(--brand-primary)] bg-[var(--brand-primary-light)]"
                      : "text-[var(--text-primary)] hover:text-[var(--brand-primary)] hover:bg-[var(--border-subtle)]/40"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" strokeWidth={2} />
                  Messages
                  {unreadCount > 0 && (
                    <span className="ml-1 flex items-center justify-center h-4.5 min-w-4.5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold shadow-xs">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>

                {/* My Listings */}
                <Link
                  href="/dashboard/my-listings"
                  prefetch={true}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                    isActive("/dashboard/my-listings")
                      ? "text-[var(--brand-primary)] bg-[var(--brand-primary-light)]"
                      : "text-[var(--text-primary)] hover:text-[var(--brand-primary)] hover:bg-[var(--border-subtle)]/40"
                  }`}
                >
                  <Store className="h-4 w-4" strokeWidth={2} />
                  My Listings
                </Link>

                {/* Orders */}
                <Link
                  href="/orders"
                  prefetch={true}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                    isActive("/orders")
                      ? "text-[var(--brand-primary)] bg-[var(--brand-primary-light)]"
                      : "text-[var(--text-primary)] hover:text-[var(--brand-primary)] hover:bg-[var(--border-subtle)]/40"
                  }`}
                >
                  <Receipt className="h-4 w-4" strokeWidth={2} />
                  Orders
                </Link>
              </>
            )}
          </nav>

          {/* Right Action Icons (Notifications & Profile Dropdown) */}
          <div className="flex items-center gap-2">
            {session?.user && (
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setIsNotifOpen((v) => !v)}
                  className="relative flex items-center justify-center h-9 w-9 rounded-xl text-[var(--text-muted)] hover:bg-[var(--border-subtle)]/50 hover:text-[var(--brand-primary)] transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[var(--card-bg)]" />
                  )}
                </button>

                {/* Notifications Popover Dropdown */}
                {isNotifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] shadow-xl py-3 z-50 divide-y divide-[var(--border-subtle)]/60">
                    <div className="px-4 pb-2 flex items-center justify-between">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)]">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    <div className="py-2 max-h-64 overflow-y-auto space-y-1">
                      {unreadCount > 0 ? (
                        <Link
                          href="/dashboard/messages"
                          onClick={() => setIsNotifOpen(false)}
                          className="flex items-start gap-3 px-4 py-2.5 hover:bg-[var(--border-subtle)]/40 transition-colors"
                        >
                          <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-[var(--brand-primary-light)] text-[var(--brand-primary)] shrink-0">
                            <MessageSquare className="w-4 h-4" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[var(--text-primary)]">New Unread Message</p>
                            <p className="text-[11px] text-[var(--text-muted)] truncate">You have unread buyer/seller messages waiting.</p>
                          </div>
                        </Link>
                      ) : (
                        <div className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">
                          No new notifications
                        </div>
                      )}
                      <div className="px-4 py-2.5 flex items-center gap-3">
                        <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--text-primary)]">CampusCart Active</p>
                          <p className="text-[11px] text-[var(--text-muted)]">Your student account is signed in.</p>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 px-4 text-center">
                      <Link
                        href="/dashboard/messages"
                        onClick={() => setIsNotifOpen(false)}
                        className="text-xs font-semibold text-[var(--brand-primary)] hover:underline"
                      >
                        View Messages →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Dropdown */}
            {status === "loading" ? (
              <div className="h-9 w-20 rounded-xl bg-[var(--border-subtle)]/40 animate-pulse" />
            ) : session?.user ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl hover:bg-[var(--border-subtle)]/40 border border-[var(--border-subtle)] transition-all cursor-pointer"
                >
                  <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-xs shadow-xs shrink-0">
                    {session.user.name?.slice(0, 2).toUpperCase() || "US"}
                  </span>
                  <span className="text-xs font-semibold text-[var(--text-primary)] hidden sm:inline max-w-[100px] truncate">
                    {session.user.name?.split(" ")[0]}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] shadow-xl py-2 z-50 divide-y divide-[var(--border-subtle)]/60">
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

                    <div className="py-1.5">
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--border-subtle)]/40 hover:text-[var(--brand-primary)] transition-colors"
                      >
                        <User className="w-4 h-4 text-[var(--text-muted)]" />
                        My Profile
                      </Link>

                      <Link
                        href="/browse?saved=true"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--border-subtle)]/40 hover:text-[var(--brand-primary)] transition-colors"
                      >
                        <Heart className="w-4 h-4 text-[var(--text-muted)]" />
                        Saved Items
                      </Link>

                      <Link
                        href="/student-verification"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--border-subtle)]/40 hover:text-[var(--brand-primary)] transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-[var(--text-muted)]" />
                        Student Verification
                      </Link>

                      <Link
                        href="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--border-subtle)]/40 hover:text-[var(--brand-primary)] transition-colors"
                      >
                        <Settings className="w-4 h-4 text-[var(--text-muted)]" />
                        Settings
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin/verifications"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)] transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-[var(--brand-primary)]" />
                          Admin Desk
                        </Link>
                      )}
                    </div>

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
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm" className="text-xs font-semibold rounded-xl text-[var(--text-primary)]">
                    Sign in
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md shadow-indigo-500/20">
                    Join CampusCart
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Button */}
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

        {/* Mobile Navigation Drawer Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-[var(--border-subtle)] py-4 space-y-4">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                openCommandPalette();
              }}
              className="flex sm:hidden items-center relative w-full h-10 rounded-full bg-[var(--input-bg)] border border-[var(--border-subtle)] pl-10 pr-3 text-xs text-[var(--text-muted)] cursor-pointer text-left"
            >
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <span>Search textbooks, lab tools, cycles...</span>
            </button>

            <div className="flex flex-col gap-1">
              <Link
                href="/browse"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 text-xs font-semibold py-2.5 px-3 rounded-xl hover:bg-[var(--border-subtle)]/40 transition-colors text-[var(--text-primary)]"
              >
                <Compass className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={2} />
                Browse Marketplace
              </Link>

              <Link
                href="/sell"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 text-xs font-bold py-2.5 px-3 rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] transition-colors"
              >
                <Plus className="h-4 w-4 text-[var(--brand-primary)] stroke-[2.5]" />
                Sell Item
              </Link>

              {session?.user && (
                <>
                  <Link
                    href="/dashboard/messages"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between text-xs font-semibold py-2.5 px-3 rounded-xl hover:bg-[var(--border-subtle)]/40 transition-colors text-[var(--text-primary)]"
                  >
                    <span className="flex items-center gap-2.5">
                      <MessageSquare className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={2} />
                      Messages
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                        {unreadCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/dashboard/my-listings"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 text-xs font-semibold py-2.5 px-3 rounded-xl hover:bg-[var(--border-subtle)]/40 transition-colors text-[var(--text-primary)]"
                  >
                    <Store className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={2} />
                    My Listings
                  </Link>

                  <Link
                    href="/orders"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 text-xs font-semibold py-2.5 px-3 rounded-xl hover:bg-[var(--border-subtle)]/40 transition-colors text-[var(--text-primary)]"
                  >
                    <Receipt className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={2} />
                    Orders
                  </Link>

                  <Link
                    href="/browse?saved=true"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 text-xs font-semibold py-2.5 px-3 rounded-xl hover:bg-[var(--border-subtle)]/40 transition-colors text-[var(--text-primary)]"
                  >
                    <Heart className="h-4 w-4 text-[var(--text-muted)]" />
                    Saved Items
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 text-xs font-semibold py-2.5 px-3 rounded-xl hover:bg-[var(--border-subtle)]/40 transition-colors text-[var(--text-primary)]"
                  >
                    <User className="h-4 w-4 text-[var(--text-muted)]" />
                    My Profile
                  </Link>

                  <Link
                    href="/student-verification"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 text-xs font-semibold py-2.5 px-3 rounded-xl hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4 text-amber-500" />
                    Student Verification
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
                    <Button size="sm" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold">
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