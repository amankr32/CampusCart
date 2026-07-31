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
  User,
  ShieldCheck,
  ListOrdered,
  ShieldAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const navLinks = [
  { href: "/browse", label: "Browse", icon: LayoutGrid },
  { href: "/sell", label: "Sell Item", icon: Tag },
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

  const studentStatus = session?.user?.studentStatus || "unverified";
  const isAdmin = session?.user?.isAdmin;

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
        // Silently ignore
      }
    };

    poll();
    const interval = setInterval(poll, UNREAD_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session?.user]);

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
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="flex items-center justify-center h-10 w-10 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <ShoppingCart className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="font-display font-bold text-xl tracking-tight text-slate-900 hidden sm:inline">
              Campus<span className="text-indigo-600">Cart</span>
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
              placeholder="Search books, lab tools, electronics..."
              className="h-10 rounded-full bg-slate-100/80 border-slate-200 pl-10 pr-12 text-sm focus:bg-white transition-all"
            />
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 min-w-5 px-1.5 rounded border border-slate-200 bg-white text-[10px] font-semibold text-slate-400">
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
                      ? "text-indigo-600 border-indigo-600"
                      : "text-slate-600 border-transparent hover:text-indigo-600"
                  }`}
                >
                  <link.icon className="h-4 w-4" strokeWidth={active ? 2.25 : 1.75} />
                  {link.label}
                </Link>
              );
            })}
            {session?.user && (
              <>
                <Link
                  href="/dashboard/my-listings"
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    isActive("/dashboard/my-listings")
                      ? "text-indigo-600 border-indigo-600"
                      : "text-slate-600 border-transparent hover:text-indigo-600"
                  }`}
                >
                  <ListOrdered className="h-4 w-4" />
                  My Listings
                </Link>
                <Link
                  href="/orders"
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    isActive("/orders")
                      ? "text-indigo-600 border-indigo-600"
                      : "text-slate-600 border-transparent hover:text-indigo-600"
                  }`}
                >
                  <Package className="h-4 w-4" />
                  Orders
                </Link>
              </>
            )}
          </div>

          <div className="flex-1" />

          {session?.user && (
            <>
              <div className="hidden lg:block h-6 w-px bg-slate-200 shrink-0" />
              <Link
                href="/dashboard/messages"
                className="relative hidden sm:flex items-center justify-center h-10 w-10 rounded-full hover:bg-slate-100 transition-colors shrink-0"
                aria-label="Messages & Notifications"
              >
                <Bell className="h-5 w-5 text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </Link>
            </>
          )}

          {/* Desktop profile menu */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {status === "loading" ? (
              <div className="h-9 w-24 rounded-lg bg-slate-100 animate-pulse" />
            ) : session?.user ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-full hover:bg-slate-100 border border-slate-200 transition-all"
                >
                  <span className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-600 text-white font-semibold text-xs shadow-sm">
                    {session.user.name?.slice(0, 2).toUpperCase() || "US"}
                  </span>
                  <div className="flex flex-col items-start text-left leading-tight hidden xl:flex">
                    <span className="text-xs font-semibold text-slate-800">{session.user.name}</span>
                    <span className="text-[10px] font-medium text-slate-500">
                      {studentStatus === "verified" ? "Verified Student" : "Unverified"}
                    </span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-xl py-2 z-50 divide-y divide-slate-100">
                    <div className="px-4 py-2.5">
                      <p className="text-xs font-semibold text-slate-900">{session.user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{session.user.email}</p>
                      <div className="mt-2 flex items-center gap-1.5">
                        {studentStatus === "verified" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" /> Verified Student
                          </span>
                        ) : (
                          <Link
                            href="/student-verification"
                            onClick={() => setIsProfileOpen(false)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100"
                          >
                            <ShieldAlert className="w-3 h-3" /> Verify Student Status
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Profile
                      </Link>
                      <Link
                        href="/dashboard/my-listings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <ListOrdered className="w-4 h-4 text-slate-400" />
                        My Listings Dashboard
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin/verifications"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          Admin Verification Desk
                        </Link>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 font-medium hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm" className="rounded-full">
                    Sign in
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium shadow-md shadow-indigo-100">
                    Join CampusCart
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="flex lg:hidden items-center justify-center h-10 w-10 rounded-full hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Toggle Navigation"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-4 flex flex-col gap-4 rounded-b-3xl">
            <form onSubmit={handleSearch} className="flex md:hidden">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items..."
                className="h-10 rounded-full"
              />
              <Button type="submit" variant="ghost" size="icon" className="h-10 w-10 -ml-10">
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 text-sm font-medium py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <link.icon className="h-4 w-4 text-slate-500" />
                  {link.label}
                </Link>
              ))}
              {session?.user && (
                <>
                  <Link
                    href="/dashboard/my-listings"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 text-sm font-medium py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <ListOrdered className="h-4 w-4 text-slate-500" />
                    My Listings Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 text-sm font-medium py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <User className="h-4 w-4 text-slate-500" />
                    My Profile
                  </Link>
                  <Link
                    href="/student-verification"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 text-sm font-medium py-2.5 px-3 rounded-xl hover:bg-amber-50 text-amber-700 transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                    Student Verification
                  </Link>
                </>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              {session?.user ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-rose-600 border-rose-200"
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                >
                  Sign out
                </Button>
              ) : (
                <>
                  <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full rounded-full">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>
                    <Button size="sm" className="w-full bg-indigo-600 text-white rounded-full">
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