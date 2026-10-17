"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Search,
  PlusCircle,
  Package,
  MessageCircle,
  ListOrdered,
  User,
  ShieldCheck,
  ShieldAlert,
} from "@/components/ui/material-symbol";

import { subscribeToUnreadCount } from "@/lib/unread-store";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  const studentStatus = session?.user?.studentStatus || "unverified";
  const isAdmin = session?.user?.isAdmin;

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

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Browse Items", href: "/browse", icon: Search },
    { label: "Sell an Item", href: "/sell", icon: PlusCircle },
    { label: "My Listings", href: "/dashboard/my-listings", icon: ListOrdered },
    { label: "My Profile", href: "/profile", icon: User },
    { label: "Student Verification", href: "/student-verification", icon: ShieldCheck },
    { label: "Orders", href: "/orders", icon: Package },
    { label: "Messages", href: "/dashboard/messages", icon: MessageCircle, showUnread: true },
  ];

  if (isAdmin) {
    navItems.push({
      label: "Admin Verification Desk",
      href: "/admin/verifications",
      icon: ShieldCheck,
    });
  }

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--card-bg)] sticky top-[84px] h-[calc(100vh-5.25rem)] overflow-y-auto">
      <nav className="flex-1 flex flex-col gap-1.5 p-4">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Navigation
        </div>

        {navItems.map(({ label, href, icon: Icon, showUnread }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl transition-all font-medium text-sm ${
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-md shadow-indigo-500/20"
                  : "text-[var(--text-primary)] hover:bg-[var(--border-subtle)]/40 hover:text-[var(--brand-primary)]"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-white" : "text-[var(--text-muted)]"}`} strokeWidth={2} />
                <span>{label}</span>
              </span>
              {showUnread && unreadCount > 0 && (
                <span className={`flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[11px] font-bold ${
                  isActive ? "bg-white text-indigo-600" : "bg-indigo-600 text-white"
                }`}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Student Status Quick Card */}
      {session?.user && (
        <div className="m-4 p-4 rounded-2xl bg-[var(--brand-primary-light)] border border-[var(--brand-primary)]/20 space-y-2">
          <div className="flex items-center gap-2">
            {studentStatus === "verified" ? (
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
            )}
            <span className="text-xs font-bold text-[var(--text-primary)]">
              {studentStatus === "verified" ? "Verified Student" : "Unverified Seller"}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-snug">
            {studentStatus === "verified"
              ? "You have unlimited selling privileges on Campus Cart."
              : "Unverified sellers can list up to 2 items. Verify your PTU portal to unlock unlimited listings."}
          </p>
          {studentStatus !== "verified" && (
            <Link href="/student-verification" className="block pt-1">
              <span className="inline-block w-full text-center text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 py-2 rounded-xl transition-all shadow-xs cursor-pointer">
                Get Student Verified
              </span>
            </Link>
          )}
        </div>
      )}
    </aside>
  );
}
