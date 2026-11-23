"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "@/lib/toast";

export function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid campus email");
      return;
    }
    toast.success("Subscribed to CampusCart newsletter!", {
      description: "You'll receive university deals and textbook drops weekly.",
    });
    setEmail("");
  };

  return (
    <footer className="border-t border-slate-200 bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12">
          
          {/* Column 1: Brand & Bio (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <Link href="/" className="inline-block">
              <span className="font-display font-black text-2xl tracking-tight text-slate-900">
                campuscart<span className="text-blue-600">.</span>
              </span>
            </Link>
            
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              CampusCart is a college marketplace. We are the student marketplace that connects campus students with verified peers for safe, 0% brokerage essentials.
            </p>
          </div>

          {/* Column 2: Company Links (4 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Company
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/about" className="text-slate-600 hover:text-blue-600 transition-colors">
                  About us
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <Link href="/contact" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Careers
                </Link>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                  We&apos;re hiring!
                </span>
              </li>
              <li>
                <Link href="/contact" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Contact us
                </Link>
              </li>
              <li>
                <Link href="/guidelines" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Privacy policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Newsletter (5 cols) */}
          <div className="md:col-span-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Subscribe to our newsletter
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              The latest items, university drops, and student deals, sent to your inbox weekly.
            </p>

            <form onSubmit={handleSubscribe} className="flex items-center gap-2 pt-1 max-w-md">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-hidden focus:border-blue-600 focus:bg-white transition-all"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
              >
                Subscribe
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Bar: Copyright matching Figma step_58_media_0.png */}
        <div className="pt-8 border-t border-slate-100 text-center text-xs text-slate-400">
          <p>
            Copyright {new Date().getFullYear()} &copy; CampusCart. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
