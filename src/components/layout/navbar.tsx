"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Plus,
  Package,
  Store,
  Heart,
  ShieldCheck,
  ShieldAlert,
  Shield,
  User,
  LogOut,
  ChevronDown,
  X,
  Menu,
} from "@/components/ui/material-symbol";

import { Button } from "@/components/ui/button";
import { subscribeToUnreadCount } from "@/lib/unread-store";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [openMenuPath, setOpenMenuPath] = useState<string | null>(null);
  const [openProfilePath, setOpenProfilePath] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const isMenuOpen = openMenuPath === pathname;
  const isProfileOpen = openProfilePath === pathname;
  const setIsMenuOpen = (val: boolean | ((prev: boolean) => boolean)) => {
    setOpenMenuPath((prev) => {
      const curr = prev === pathname;
      const next = typeof val === "function" ? val(curr) : val;
      return next ? pathname : null;
    });
  };
  const setIsProfileOpen = (val: boolean | ((prev: boolean) => boolean)) => {
    setOpenProfilePath((prev) => {
      const curr = prev === pathname;
      const next = typeof val === "function" ? val(curr) : val;
      return next ? pathname : null;
    });
  };

  const profileRef = useRef<HTMLDivElement>(null);
  const studentStatus = session?.user?.studentStatus || "unverified";

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setOpenProfilePath(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Listen to shared unread messages count
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

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-colors">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-8">
        <div className="h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-6">
          
          {/* 1. BRAND LOGO (Figma FlipEarn Style: clean lowercase campuscart. with blue dot) */}
          <Link href="/" className="flex items-center gap-1 shrink-0 min-w-0">
            <span className="font-display font-black text-xl sm:text-2xl tracking-tight text-slate-900">
              campuscart<span className="text-blue-600">.</span>
            </span>
          </Link>

          {/* 2. CENTER NAV LINKS (Figma Layout: Home, Marketplace, Messages, My Listings) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link
              href="/"
              prefetch={true}
              className={`text-sm transition-colors ${
                pathname === "/"
                  ? "text-blue-600 font-bold"
                  : "text-slate-600 hover:text-blue-600 font-medium"
              }`}
            >
              Home
            </Link>

            <Link
              href="/browse"
              prefetch={true}
              className={`text-sm transition-colors ${
                isActive("/browse")
                  ? "text-blue-600 font-bold"
                  : "text-slate-600 hover:text-blue-600 font-medium"
              }`}
            >
              Marketplace
            </Link>

            <Link
              href={session?.user ? "/dashboard/messages" : "/sign-in?callbackUrl=/dashboard/messages"}
              prefetch={true}
              className={`text-sm transition-colors relative flex items-center gap-1.5 ${
                isActive("/dashboard/messages")
                  ? "text-blue-600 font-bold"
                  : "text-slate-600 hover:text-blue-600 font-medium"
              }`}
            >
              <span>Messages</span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-extrabold shadow-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            <Link
              href={session?.user ? "/dashboard/my-listings" : "/sign-in?callbackUrl=/dashboard/my-listings"}
              prefetch={true}
              className={`text-sm transition-colors ${
                isActive("/dashboard/my-listings")
                  ? "text-blue-600 font-bold"
                  : "text-slate-600 hover:text-blue-600 font-medium"
              }`}
            >
              My Listings
            </Link>
          </nav>

          {/* 3. RIGHT ACTIONS (Figma Style: Clean Login + Blue Button) */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {status === "loading" ? (
              <div className="h-9 w-20 rounded-xl bg-slate-100 animate-pulse" />
            ) : session?.user ? (
              <div className="flex items-center gap-1.5 sm:gap-3">
                {/* + Sell Button */}
                <Link href="/sell" prefetch={true}>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 h-8.5 sm:h-9 rounded-xl shadow-xs transition-all active:scale-95 border-0"
                  >
                    <Plus className="h-4 w-4 mr-0.5 sm:mr-1" />
                    <span className="sm:hidden">Sell</span>
                    <span className="hidden sm:inline">Sell Item</span>
                  </Button>
                </Link>

                {/* Account Menu Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen((v) => !v)}
                    className="flex items-center gap-1.5 sm:gap-2 pl-1.5 pr-1.5 sm:pl-2 sm:pr-2.5 py-1 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                    aria-label="User Account Menu"
                  >
                    <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-blue-600 text-white font-bold text-xs shrink-0 shadow-xs">
                      {session.user.name?.slice(0, 2).toUpperCase() || "CC"}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 hidden sm:inline max-w-[90px] truncate">
                      {session.user.name?.split(" ")[0]}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-200 bg-white shadow-lg py-2 z-50 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                      {/* User Header */}
                      <div className="px-4 py-3">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {session.user.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {session.user.email}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5">
                          {studentStatus === "verified" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3" /> Verified Student
                            </span>
                          ) : (
                            <Link
                              href="/student-verification"
                              onClick={() => setIsProfileOpen(false)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors"
                            >
                              <ShieldAlert className="w-3 h-3" /> Unverified Member
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Account Links */}
                      <div className="py-1.5">
                        <Link
                          href="/profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>Profile &amp; Account</span>
                        </Link>

                        {session.user.isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center justify-between px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-colors"
                          >
                            <span className="flex items-center gap-2.5">
                              <Shield className="w-4 h-4 text-purple-600" />
                              <span>Admin Center</span>
                            </span>
                            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200">
                              Admin
                            </span>
                          </Link>
                        )}

                        <Link
                          href="/dashboard/my-listings"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        >
                          <Store className="w-4 h-4 text-slate-400" />
                          <span>My Listings &amp; Storefront</span>
                        </Link>

                        <Link
                          href="/orders"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        >
                          <Package className="w-4 h-4 text-slate-400" />
                          <span>My Orders &amp; Purchases</span>
                        </Link>

                        <Link
                          href="/browse?saved=true"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        >
                          <Heart className="w-4 h-4 text-slate-400" />
                          <span>Wishlist &amp; Saved</span>
                        </Link>

                        <Link
                          href="/student-verification"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-slate-400" />
                          <span>Student Verification</span>
                        </Link>
                      </div>

                      {/* Sign Out */}
                      <div className="py-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            signOut({ callbackUrl: "/" });
                          }}
                          className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Sign out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/sign-in"
                  className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 px-2.5 sm:px-3 py-1.5 sm:py-2 transition-colors whitespace-nowrap"
                >
                  Log In
                </Link>
                <Link href="/sell">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 h-8.5 sm:h-9 rounded-xl shadow-xs transition-all border-0 whitespace-nowrap"
                  >
                    <span className="sm:hidden">Sell</span>
                    <span className="hidden sm:inline">Sell an Item</span>
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMenuOpen((v) => !v)}
              className="flex md:hidden items-center justify-center h-9 w-9 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle Navigation"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-100 py-3.5 pb-5 space-y-1.5 max-h-[calc(100dvh-3.5rem)] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                pathname === "/" ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              Home
            </Link>
            <Link
              href="/browse"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                isActive("/browse") ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              Marketplace
            </Link>
            <Link
              href={session?.user ? "/dashboard/messages" : "/sign-in?callbackUrl=/dashboard/messages"}
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                isActive("/dashboard/messages") ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>Messages</span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <Link
              href={session?.user ? "/dashboard/my-listings" : "/sign-in?callbackUrl=/dashboard/my-listings"}
              onClick={() => setIsMenuOpen(false)}
              className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                isActive("/dashboard/my-listings") ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              My Listings
            </Link>

            {session?.user ? (
              <>
                <div className="my-2 border-t border-slate-100" />
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                    pathname === "/dashboard" ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Dashboard Overview
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                    isActive("/orders") ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  My Orders &amp; Purchases
                </Link>
                <Link
                  href="/student-verification"
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                    isActive("/student-verification") ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>Student Verification</span>
                  {studentStatus === "verified" ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                      Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                      Verify
                    </span>
                  )}
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                    isActive("/profile") ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Profile &amp; Account
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                    isActive("/settings") ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Settings &amp; Theme
                </Link>

                {session.user.isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                      isActive("/admin") ? "bg-purple-50 text-purple-700 font-bold" : "text-purple-700 hover:bg-purple-50"
                    }`}
                  >
                    Admin Command Center
                  </Link>
                )}

                <div className="pt-2 space-y-2">
                  <Link href="/sell" onClick={() => setIsMenuOpen(false)} className="block">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold">
                      + Post New Listing
                    </Button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-2 grid grid-cols-2 gap-2">
                <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-xl py-2.5 text-sm font-semibold border-slate-200">
                    Log In
                  </Button>
                </Link>
                <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
