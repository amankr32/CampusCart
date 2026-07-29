"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ChevronDown, LogOut, Menu, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessagesNavLink } from "@/components/layout/messages-nav-link";

const navLinks = [
  { href: "/browse", label: "Browse" },
  { href: "/sell", label: "Sell" },
  { href: "/how-it-works", label: "How it works" },
];

export function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    setIsMenuOpen(false);
    router.push(`/browse?${params.toString()}`);
  };

  return (
    <nav className="border-b border-[var(--border-subtle)] bg-white/95 backdrop-blur sticky top-0 z-50">
      <div className="h-20 max-w-(--breakpoint-xl) mx-auto flex items-center gap-4 px-4 lg:px-12">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex items-center justify-center h-9 w-9 rounded-lg bg-[var(--brand-orange)] text-white font-display font-bold text-sm">
            PB
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display font-bold text-lg tracking-tight hidden sm:inline">
              <span className="text-foreground">PTU </span>
              <span className="text-[var(--brand-orange)]">Bazar</span>
            </span>
            <span className="text-[10px] text-black/40 hidden sm:inline">
              Only for PTU Students
            </span>
          </span>
        </Link>

        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-sm"
        >
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search listings..."
            className="h-9"
          />
          <Button type="submit" variant="ghost" size="icon" className="h-9 w-9 -ml-9">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <div className="hidden lg:flex items-center gap-6 shrink-0">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-black/70 hover:text-[var(--brand-orange)] transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {session?.user && (
            <>
              <Link
                href="/orders"
                className="text-sm font-medium text-black/70 hover:text-[var(--brand-orange)] transition-colors"
              >
                Orders
              </Link>
              <Link
                href="/dashboard/sales"
                className="text-sm font-medium text-black/70 hover:text-[var(--brand-orange)] transition-colors"
              >
                Sales
              </Link>
            </>
          )}
        </div>

        <MessagesNavLink />

        {/* Desktop auth actions */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {status === "loading" ? (
            <div className="h-9 w-24 rounded-lg bg-black/5 animate-pulse" />
          ) : session?.user ? (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen((v) => !v)}
                className="flex items-center gap-2 pl-1 pr-2 h-9 rounded-lg hover:bg-black/5 transition-colors"
              >
                <span className="flex items-center justify-center h-7 w-7 rounded-full bg-[var(--brand-orange-light)] text-[var(--brand-orange)] font-display font-semibold text-xs shrink-0">
                  {session.user.username?.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-sm font-medium">
                  {session.user.username}
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
                <Button variant="brand" size="sm">
                  Join PTU Bazar
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
        <div className="lg:hidden border-t border-[var(--border-subtle)] bg-white px-4 py-4 flex flex-col gap-4">
          <form onSubmit={handleSearch} className="flex md:hidden">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search listings..."
              className="h-9"
            />
            <Button type="submit" variant="ghost" size="icon" className="h-9 w-9 -ml-9">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="text-sm font-medium py-2 hover:opacity-70 transition-opacity"
              >
                {link.label}
              </Link>
            ))}
            {session?.user && (
              <>
                <Link
                  href="/orders"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-sm font-medium py-2 hover:opacity-70 transition-opacity"
                >
                  Orders
                </Link>
                <Link
                  href="/dashboard/sales"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-sm font-medium py-2 hover:opacity-70 transition-opacity"
                >
                  Sales
                </Link>
                <Link
                  href="/dashboard/messages"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-sm font-medium py-2 hover:opacity-70 transition-opacity"
                >
                  Messages
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
                  <Button variant="brand" size="sm" className="w-full">
                    Join PTU Bazar
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
