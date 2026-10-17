import Link from "next/link";
import { ShoppingBag, ShieldCheck } from "@/components/ui/material-symbol";

const footerColumns = [
  {
    title: "Marketplace",
    links: [
      { href: "/browse", label: "Browse Items" },
      { href: "/sell", label: "Sell an Item" },
      { href: "/how-it-works", label: "How It Works" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/faq", label: "Help Center & FAQs" },
      { href: "/contact", label: "Contact Us" },
      { href: "/safety", label: "Campus Safety Guidelines" },
      { href: "/student-verification", label: "Student Verification" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/profile", label: "My Profile" },
      { href: "/dashboard/my-listings", label: "My Listings" },
      { href: "/orders", label: "My Orders" },
    ],
  },
  {
    title: "Legal & Info",
    links: [
      { href: "/about", label: "About CampusCart" },
      { href: "/guidelines", label: "Privacy Policy" },
      { href: "/guidelines", label: "Terms of Service" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--card-bg)] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-3 group">
              <span className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-sm group-hover:from-indigo-700 group-hover:to-indigo-600 transition-all">
                <ShoppingBag className="h-4.5 w-4.5" strokeWidth={2} />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="font-display font-bold text-lg text-[var(--text-primary)]">
                  Campus<span className="text-[var(--brand-primary)]">Cart</span>
                </span>
                <span className="text-[10px] font-bold text-[var(--brand-primary)] uppercase tracking-wider">
                  IKGPTU Marketplace
                </span>
              </div>
            </Link>
            <p className="text-xs text-[var(--text-muted)] max-w-[240px] leading-relaxed mb-4">
              An exclusive, verified peer-to-peer student marketplace for textbooks, lab gear, cycles, and student essentials.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> 100% Trusted Student Marketplace
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[var(--text-primary)] mb-3.5">
                {column.title}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-muted)]">
            &copy; {new Date().getFullYear()} CampusCart. All rights reserved.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Built for IKGPTU students.
          </p>
        </div>
      </div>
    </footer>
  );
}
