import Link from "next/link";
import {
  BookOpen,
  Bike,
  Laptop,
  BedDouble,
  PenTool,
  Dumbbell,
  ArrowRight,
  ShieldCheck,
  Wallet,
  MessageCircle,
  Award,
  Sparkles,
} from "@/components/ui/material-symbol";

import { Button } from "@/components/ui/button";
import { getProducts } from "@/db/queries/products";
import { HeroSearch } from "@/components/home/hero-search";
import { HeroPreviewCard } from "@/components/home/hero-preview-card";

const categories = [
  { icon: BookOpen, label: "Textbooks & Notes", href: "/browse?category=books" },
  { icon: BedDouble, label: "Hostel Essentials", href: "/browse?category=hostel" },
  { icon: Bike, label: "Cycles & Transport", href: "/browse?category=transport" },
  { icon: Laptop, label: "Electronics & Gadgets", href: "/browse?category=electronics" },
  { icon: PenTool, label: "Stationery & Supplies", href: "/browse?category=stationery" },
  { icon: Dumbbell, label: "Sports & Fitness", href: "/browse?category=sports" },
];

const steps = [
  {
    icon: PenTool,
    title: "Post your item in 60 seconds",
    description:
      "Take photos of your books, calculators, or gadgets. Set your price and publish instantly.",
  },
  {
    icon: MessageCircle,
    title: "Chat with verified students",
    description:
      "Connect safely via in-app chat with real university students on campus.",
  },
  {
    icon: Wallet,
    title: "Offline campus handoff",
    description:
      "Meet at your hostel or library, inspect the item, and complete payment safely in person.",
  },
];

const stats = [
  { value: "1,200+", label: "Verified Students" },
  { value: "2,500+", label: "Campus Listings" },
  { value: "100%", label: "Email OTP Verified" },
  { value: "₹8 Lakh+", label: "Saved by Students" },
];

export default async function HomePage() {
  // Query newest listing for real-time interactive hero preview
  const { docs: latestProducts, totalCount } = await getProducts({
    page: 1,
    sort: "newest",
  }).catch(() => ({ docs: [], totalCount: 14 }));

  const featuredProduct = latestProducts?.[0] || null;
  const itemsTodayCount = totalCount > 0 ? totalCount : 14;

  return (
    <div className="flex flex-col">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HERO SECTION: HIGH-INTENT CAMPUS HUB WITH SPLIT PREVIEW CARD */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden border-b border-[var(--border-subtle)] bg-gradient-to-b from-[var(--brand-primary-light)]/40 via-[var(--background)] to-[var(--background)]">
        {/* Subtle decorative background blur spots */}
        <div className="absolute top-0 right-1/4 -z-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -z-10 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Copy, Search & CTAs (7 cols on lg) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Live Campus Activity Ticker */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold shadow-xs">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>
                  <strong>{itemsTodayCount} items listed</strong> today by IKGPTU students
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.08] tracking-tight text-[var(--text-primary)]">
                The Safe Campus Marketplace for{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                  Books, Tech &amp; Hostel Gear
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg leading-relaxed text-[var(--text-muted)] max-w-xl">
                Buy, sell, and swap semester textbooks, scientific calculators, drafters, cycles, and electronics exclusively with verified university peers. Zero listing fees, 100% email OTP verified.
              </p>

              {/* Embedded Hero Search & Hotkey with Trending Pills */}
              <div className="pt-2 max-w-xl">
                <HeroSearch />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/browse">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-2xl h-12 px-7 font-semibold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                  >
                    <span>Browse All Listings</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/sell">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-[var(--border-subtle)] hover:bg-[var(--border-subtle)]/30 text-[var(--text-primary)] rounded-2xl h-12 px-7 font-semibold active:scale-95 transition-all"
                  >
                    <span>Post a Free Listing</span>
                  </Button>
                </Link>
              </div>

              {/* Verified Trust Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 max-w-2xl border-t border-[var(--border-subtle)]">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="font-display font-bold text-2xl text-[var(--brand-primary)]">
                      {stat.value}
                    </p>
                    <p className="text-xs font-medium text-[var(--text-muted)] mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Interactive Tilted Preview Card (5 cols on lg) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <HeroPreviewCard product={featuredProduct} />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. STUDENT VERIFICATION & TRUST ENGINE HIGHLIGHT */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-7xl mx-auto px-4 lg:px-12 py-12 w-full">
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl border border-indigo-800/40 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-400/30">
              <Award className="w-4 h-4 text-indigo-400" />
              <span>Student Verification &amp; Anti-Fraud Engine</span>
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight leading-snug">
              Get Verified &amp; Unlock Unlimited Selling Privileges
            </h2>
            <p className="text-sm text-indigo-100/80 leading-relaxed">
              Verify your student identity using your PTU Portal to receive your Verified Student Badge, higher trust rank, and unlimited product listings!
            </p>
          </div>
          <Link href="/student-verification" className="shrink-0">
            <Button
              size="lg"
              className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl h-12 px-7 font-bold shadow-lg shadow-indigo-950/60 active:scale-95 transition-all"
            >
              Get Verified Now
            </Button>
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. CATEGORIES SECTION */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-7xl mx-auto px-4 lg:px-12 py-12 w-full">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[var(--text-primary)] mb-1.5">
              Shop by Student Category
            </h2>
            <p className="text-[var(--text-muted)] text-sm sm:text-base">
              Find essential semester tools right on your campus.
            </p>
          </div>
          <Link
            href="/browse"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-primary)] hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {categories.map(({ icon: Icon, label, href }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col items-start gap-4 p-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-bg)] shadow-xs hover:shadow-lg hover:border-[var(--brand-primary)]/40 transition-all hover:-translate-y-1"
            >
              <span className="flex items-center justify-center h-12 w-12 rounded-2xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-colors duration-300 shadow-2xs">
                <Icon className="h-6 w-6" strokeWidth={2} />
              </span>
              <span className="font-semibold text-sm sm:text-base text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. HOW CAMPUS CART WORKS */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-[var(--card-bg)]/50 border-y border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 lg:px-12 py-16 sm:py-20">
          <div className="max-w-2xl mb-10">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[var(--text-primary)] mb-2">
              How Campus Cart Works
            </h2>
            <p className="text-[var(--text-muted)] text-sm sm:text-base">
              Three simple steps designed for quick, zero-friction handoffs on campus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map(({ icon: Icon, title, description }, index) => (
              <div
                key={title}
                className="flex flex-col gap-4 p-7 rounded-3xl bg-[var(--card-bg)] border border-[var(--border-subtle)] shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-9 w-9 rounded-full bg-[var(--brand-primary)] text-white text-sm font-bold shadow-xs">
                    {index + 1}
                  </span>
                  <Icon className="h-6 w-6 text-[var(--brand-primary)]" strokeWidth={2} />
                </div>
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                  {title}
                </h3>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
