import Link from "next/link";
import { ShoppingBag, ShieldCheck, MapPin } from "@/components/ui/material-symbol";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand & Campus Identity */}
          <div className="md:col-span-1 space-y-3">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <span className="flex items-center justify-center h-9 w-9 rounded-xl bg-indigo-600 text-white shadow-xs group-hover:bg-indigo-700 transition-colors">
                <ShoppingBag className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="font-display font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                Campus<span className="text-indigo-600">Cart</span>
              </span>
            </Link>
            
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              The student-to-student marketplace for IKGPTU. Buy and sell semester books, drafters, calculators, and hostel gear without middleman fees.
            </p>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>IKGPTU Main Campus, Kapurthala</span>
            </div>
          </div>

          {/* Quick Links Column 1: Marketplace */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Marketplace
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/browse" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Browse All Listings
                </Link>
              </li>
              <li>
                <Link href="/sell" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  + Sell an Item
                </Link>
              </li>
              <li>
                <Link href="/browse?category=books" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Textbooks &amp; Notes
                </Link>
              </li>
              <li>
                <Link href="/browse?category=electronics" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Calculators &amp; Electronics
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links Column 2: Trust & Safety */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Trust &amp; Safety
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/student-verification" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Get Student Verified
                </Link>
              </li>
              <li>
                <Link href="/safety" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Safe Campus Meetup Spots
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  How Buying &amp; Selling Works
                </Link>
              </li>
              <li>
                <Link href="/guidelines" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Community Rules
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links Column 3: Help & Account */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Support &amp; Account
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/faq" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Help Center &amp; FAQs
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  My Orders
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  My Profile
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Contact Campus Team
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Note */}
        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} CampusCart &bull; Built for IKGPTU students
          </p>

          <div className="flex items-center gap-4">
            <Link href="/guidelines" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Privacy
            </Link>
            <span>&bull;</span>
            <Link href="/guidelines" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Terms
            </Link>
            <span>&bull;</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Students Only
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
