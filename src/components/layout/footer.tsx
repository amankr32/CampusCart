"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, MapPin } from "@/components/ui/material-symbol";

export function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard/messages")) {
    return null;
  }

  return (
    <footer className="border-t border-slate-200 bg-slate-50/60 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-10 sm:pt-12 pb-24 md:pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 pb-8 sm:pb-10">
          {/* Column 1: Brand & Campus Trust */}
          <div className="md:col-span-5 space-y-3">
            <Link href="/" className="inline-block">
              <span className="font-display font-black text-2xl tracking-tight text-slate-900">
                campuscart<span className="text-blue-600">.</span>
              </span>
            </Link>

            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              Peer-to-peer marketplace for IKGPTU students. Buy and sell textbooks, drafters, electronics, cycles, and hostel gear safely on campus with 0% commission.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Campus Peers
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                In-Person Campus Handoff
              </span>
            </div>
          </div>

          {/* Columns 2 & 3: Side-by-side on mobile & desktop */}
          <div className="md:col-span-7 grid grid-cols-2 gap-6 sm:gap-8">
            {/* Marketplace Links */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                Marketplace
              </h3>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link href="/browse" className="text-slate-600 hover:text-blue-600 transition-colors">
                    Browse Listings
                  </Link>
                </li>
                <li>
                  <Link href="/sell" className="text-slate-600 hover:text-blue-600 transition-colors">
                    Sell an Item
                  </Link>
                </li>
                <li>
                  <Link href="/student-verification" className="text-slate-600 hover:text-blue-600 transition-colors">
                    Student Verification
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="text-slate-600 hover:text-blue-600 transition-colors">
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>

            {/* Campus Safety & Support */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                Safety &amp; Support
              </h3>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link href="/safety" className="text-slate-600 hover:text-blue-600 transition-colors">
                    Campus Safety Tips
                  </Link>
                </li>
                <li>
                  <Link href="/guidelines" className="text-slate-600 hover:text-blue-600 transition-colors">
                    Community Guidelines
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-slate-600 hover:text-blue-600 transition-colors">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-slate-600 hover:text-blue-600 transition-colors">
                    Contact Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Compact Bottom Bar */}
        <div className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p className="text-center sm:text-left">
            &copy; {new Date().getFullYear()} CampusCart. Built for IKGPTU students.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-blue-600 transition-colors">
              About
            </Link>
            <Link href="/safety" className="hover:text-blue-600 transition-colors">
              Safety
            </Link>
            <Link href="/guidelines" className="hover:text-blue-600 transition-colors">
              Guidelines
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
