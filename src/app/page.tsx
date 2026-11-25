import Link from "next/link";
import {
  Check,
  Star,
  ShieldCheck,
  ArrowRight,
  Store,
} from "@/components/ui/material-symbol";

import { Button } from "@/components/ui/button";
import { getProducts } from "@/db/queries/products";
import { HeroSearch } from "@/components/home/hero-search";
import { ProductCard } from "@/components/products/product-card";

export default async function HomePage() {
  // Query newest listings for direct home page display
  const { docs: allLatest, totalCount } = await getProducts({
    page: 1,
    sort: "newest",
  }).catch(() => ({ docs: [], totalCount: 0 }));

  const latestProducts = allLatest.slice(0, 6);

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HERO SECTION (Figma FlipEarn Exact Layout) */}
      {/* ------------------------------------------------------------------ */}
      <section className="pt-10 sm:pt-20 pb-10 sm:pb-16 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto space-y-5 sm:space-y-6 w-full">
        
        {/* Social Proof Pill: Avatars + Stars + Used by */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 shadow-2xs max-w-full">
          <div className="flex -space-x-2 overflow-hidden shrink-0">
            <span className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
              AK
            </span>
            <span className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center">
              RS
            </span>
            <span className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
              MK
            </span>
            <span className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
              PT
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <div className="flex text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400" />
            </div>
            <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
              Used by 10,000+ students
            </span>
          </div>
        </div>

        {/* Headline with Pink Curved Underline (Figma Style) */}
        <h1 className="font-display font-black text-[1.85rem] sm:text-5xl lg:text-6xl text-slate-900 tracking-tight leading-[1.15]">
          Buy &amp; Sell your{" "}
          <span className="relative text-blue-600 inline-block pb-1 sm:pb-0">
            College Essentials
            <svg
              className="absolute -bottom-1 sm:-bottom-3 left-0 w-full overflow-visible"
              viewBox="0 0 260 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 10C65 2.5 195 2.5 257 10"
                stroke="#EC4899"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </span>{" "}
          <br className="hidden sm:inline" />
          online.
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed pt-1">
          A secure marketplace to buy and sell textbooks, notes, calculators, cycles, and hostel gear — fast, safe and hassle-free.
        </p>

        {/* Centered Search Bar */}
        <div className="pt-2">
          <HeroSearch />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. LATEST LISTINGS (Figma FlipEarn Card Stack) */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-5 sm:space-y-6">
        <div className="text-center space-y-1">
          <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900">
            Latest Listings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Discover the hottest college essentials available right now.
          </p>
        </div>

        {latestProducts && latestProducts.length > 0 ? (
          <div className="flex flex-col gap-5 pt-4">
            {latestProducts.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                view="grid"
                isFeatured={idx < 2}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              No listings posted yet
            </h3>
            <p className="text-xs text-slate-500">
              Be the first student to post a textbook, drafter, or cycle on CampusCart!
            </p>
            <div className="pt-2">
              <Link href="/sell">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer">
                  + Post First Listing
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* View All Listings Button */}
        {latestProducts && latestProducts.length > 0 && (
          <div className="pt-4 text-center">
            <Link href="/browse">
              <Button
                variant="outline"
                className="rounded-xl px-6 py-2.5 text-xs font-semibold border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-all cursor-pointer"
              >
                <span>View all listings ({totalCount})</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. CHOOSE YOUR PLAN (Figma FlipEarn Pricing / Tier Cards) */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8 sm:space-y-10">
        <div className="text-center space-y-1">
          <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900">
            Choose Your Plan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Start for free and level up as you grow. Find the perfect plan for your college trading needs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Card 1: Free */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 space-y-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Free
                </h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display font-black text-3xl sm:text-4xl text-slate-900">
                    ₹0
                  </span>
                  <span className="text-xs text-slate-400">/ forever</span>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>5 Free Active Listings</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Direct In-App Student Chat</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Campus Meetup Locations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Email Support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>0% Brokerage &amp; Commission</span>
                </li>
              </ul>
            </div>

            <Link href="/sell" className="w-full">
              <Button
                variant="outline"
                className="w-full rounded-xl py-2.5 text-xs font-semibold border-slate-300 hover:border-blue-500 hover:text-blue-600 transition-all cursor-pointer"
              >
                Start Free
              </Button>
            </Link>
          </div>

          {/* Card 2: Verified Student */}
          <div className="relative rounded-2xl border-2 border-blue-600 bg-white p-6 sm:p-7 space-y-6 shadow-md flex flex-col justify-between">
            <div className="absolute -top-3 right-6 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
              Recommended
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-display font-bold text-base text-blue-600">
                  Verified Student
                </h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display font-black text-3xl sm:text-4xl text-slate-900">
                    Free
                  </span>
                  <span className="text-xs text-slate-400">with IKGPTU Roll No.</span>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-medium">Unlimited Free Listings</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-medium">Official Green Verified Badge</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Priority Placement in Search</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Public Verified Seller Trust Score</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>0% Brokerage &amp; Commission</span>
                </li>
              </ul>
            </div>

            <Link href="/student-verification" className="w-full">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-xs font-semibold shadow-xs transition-all border-0 cursor-pointer">
                Get Student Verified
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. CONFIDENCE PROMOTIONAL BANNER (Figma FlipEarn Exact Layout) */}
      {/* ------------------------------------------------------------------ */}
      <section className="pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-50/80 via-blue-50/70 to-purple-50/80 border border-blue-100/80 p-6 sm:p-14 text-center space-y-4 sm:space-y-5 shadow-xs">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[11px] font-bold text-blue-600 border border-purple-200 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Trusted by IKGPTU Students</span>
          </div>

          <h2 className="font-display font-black text-2xl sm:text-4xl text-slate-900 tracking-tight">
            Sell your College Essentials <br className="hidden sm:inline" />
            with <span className="text-purple-600">Confidence</span> &amp; Earn Money
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            The dedicated campus marketplace connecting students directly with their peers. Trade safely with verified classmates using in-person campus meetups.
          </p>

          <div className="pt-2">
            <Link href="/sell">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-xs transition-all border-0 cursor-pointer">
                Get Started Today
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
