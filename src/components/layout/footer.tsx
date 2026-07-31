import Link from "next/link";
import { ShoppingCart, ShieldCheck } from "lucide-react";

const columns = [
  {
    title: "Marketplace",
    links: [
      { href: "/browse", label: "Browse Books & Items" },
      { href: "/sell", label: "Create a Listing" },
      { href: "/how-it-works", label: "How it Works" },
    ],
  },
  {
    title: "Student Support",
    links: [
      { href: "/student-verification", label: "Student Verification" },
      { href: "/safety", label: "Campus Safety Guidelines" },
      { href: "/contact", label: "Contact Support" },
      { href: "/faq", label: "Marketplace FAQs" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "/about", label: "About Campus Cart" },
      { href: "/guidelines", label: "Student Rules & Ethics" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 lg:px-12 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="flex items-center justify-center h-9 w-9 rounded-xl bg-indigo-600 text-white shadow-sm">
                <ShoppingCart className="h-4.5 w-4.5" strokeWidth={2.2} />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="font-display font-bold text-lg text-slate-900">
                  Campus<span className="text-indigo-600">Cart</span>
                </span>
                <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
                  IKGPTU Marketplace
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-600 max-w-[240px] leading-relaxed mb-4">
              An exclusive, verified peer-to-peer marketplace built by and for university students.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% Student Marketplace
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="font-display font-semibold text-sm text-slate-900 mb-3.5">
                {column.title}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Campus Cart. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">
            Built with care for university students.
          </p>
        </div>
      </div>
    </footer>
  );
}
