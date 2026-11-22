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
  Plus,
  Store,
  CheckCircle,
} from "@/components/ui/material-symbol";

import { Button } from "@/components/ui/button";
import { getProducts } from "@/db/queries/products";
import { HeroSearch } from "@/components/home/hero-search";
import { ProductCard } from "@/components/products/product-card";

const categories = [
  { icon: BookOpen, label: "Textbooks & Notes", href: "/browse?category=books", desc: "Sem 1–8 Books & Notes" },
  { icon: Laptop, label: "Electronics & Tech", href: "/browse?category=electronics", desc: "Casio fx-991, Gadgets" },
  { icon: Bike, label: "Cycles & Commute", href: "/browse?category=transport", desc: "Campus Bicycles" },
  { icon: BedDouble, label: "Hostel Essentials", href: "/browse?category=hostel", desc: "Kettles, Mattresses, Lamps" },
  { icon: PenTool, label: "Stationery & Tools", href: "/browse?category=stationery", desc: "Drafters, Aprons, Kits" },
  { icon: Dumbbell, label: "Sports & Fitness", href: "/browse?category=sports", desc: "Badminton, Gym Gear" },
];

const campusFeatures = [
  {
    icon: ShieldCheck,
    title: "Verified Students Only",
    desc: "Every account is verified via IKGPTU student ID or roll number. No outside strangers.",
  },
  {
    icon: MessageCircle,
    title: "Safe In-App Chat",
    desc: "Message buyers and sellers securely without needing to share personal phone numbers.",
  },
  {
    icon: Wallet,
    title: "Zero Brokerage Fees",
    desc: "Free to list and sell. Keep 100% of the money you make on your books and gear.",
  },
  {
    icon: Store,
    title: "Campus Meetups",
    desc: "Inspect items in person at the Library, Canteen, or Hostel gate before paying.",
  },
];

const steps = [
  {
    num: "1",
    title: "Post your item in 1 minute",
    desc: "Snap 2-3 quick photos, set your price, and pick your hostel block or campus pickup spot.",
  },
  {
    num: "2",
    title: "Chat directly with peers",
    desc: "Interested classmates message you in the app to ask questions, negotiate, and agree on a deal.",
  },
  {
    num: "3",
    title: "Meet up & hand over",
    desc: "Meet at a safe public spot like the central library or canteen. Check the item and pay via UPI or cash.",
  },
];

export default async function HomePage() {
  // Query newest listings for direct home page display
  const { docs: allLatest, totalCount } = await getProducts({
    page: 1,
    sort: "newest",
  }).catch(() => ({ docs: [], totalCount: 0 }));

  const latestProducts = allLatest.slice(0, 8);

  return (
    <div className="flex flex-col">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HERO SECTION: CLEAN, HUMAN, INTUITIVE CAMPUS MARKETPLACE */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-b border-[var(--border-subtle)] bg-[var(--card-bg)]/40 py-12 sm:py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          {/* Friendly University Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--card-bg)] text-xs font-semibold text-[var(--brand-primary)] shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span>IKGPTU Student Marketplace</span>
          </div>

          {/* Natural, Clear Headline */}
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-[var(--text-primary)] tracking-tight leading-[1.12]">
            Buy &amp; Sell on Campus with <br className="hidden sm:inline" />
            <span className="text-[var(--brand-primary)]">Fellow Students</span>
          </h1>

          {/* Conversational, Student-Oriented Subtitle */}
          <p className="text-base sm:text-lg text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
            The safe, peer-to-peer marketplace for IKGPTU. Find used semester textbooks, scientific calculators, cycles, and hostel gear — chat in-app and hand off in person.
          </p>

          {/* Hero Search Box */}
          <div className="pt-2 max-w-2xl mx-auto text-left">
            <HeroSearch />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link href="/browse">
              <Button
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-6 font-semibold shadow-xs transition-all"
              >
                <span>Browse All Items</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
            <Link href="/sell">
              <Button
                variant="outline"
                size="lg"
                className="border-[var(--border-subtle)] hover:bg-[var(--border-subtle)]/40 text-[var(--text-primary)] rounded-xl h-11 px-6 font-semibold transition-all"
              >
                <Plus className="h-4 w-4 mr-1.5 text-indigo-600" />
                <span>Post a Free Listing</span>
              </Button>
            </Link>
          </div>

          {/* Grounded Campus Value Points */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-[var(--border-subtle)] max-w-4xl mx-auto text-left">
            {campusFeatures.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] space-y-1">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Icon className="w-4 h-4" />
                  <span className="font-bold text-xs text-[var(--text-primary)]">{title}</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-tight">{desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. FRESH ON CAMPUS (REAL LIVE PRODUCTS FROM DATABASE) */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              <span>Recently Posted</span>
            </div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--text-primary)]">
              Fresh Listings on Campus
            </h2>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              Check out what classmates have listed today. Hand off at your hostel or library.
            </p>
          </div>
          <Link
            href="/browse"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-primary)] hover:underline"
          >
            <span>View all listings ({totalCount})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {latestProducts && latestProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} view="grid" />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-6 rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--card-bg)] space-y-3 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] flex items-center justify-center mx-auto">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[var(--text-primary)] text-base">No listings posted yet</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Be the first student to post a textbook, drafter, or cycle on CampusCart!
            </p>
            <div className="pt-2">
              <Link href="/sell">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
                  + Post First Listing
                </Button>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. BROWSE BY STUDENT CATEGORY */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-[var(--card-bg)]/50 border-y border-[var(--border-subtle)] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--text-primary)]">
                Browse by Category
              </h2>
              <p className="text-[var(--text-muted)] text-sm mt-1">
                Everything you need for your semester, from textbooks to hostel appliances.
              </p>
            </div>
            <Link
              href="/browse"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-primary)] hover:underline"
            >
              <span>All categories</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
            {categories.map(({ icon: Icon, label, href, desc }) => (
              <Link
                key={label}
                href={href}
                className="group flex items-start gap-4 p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] hover:border-indigo-500/50 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] group-hover:text-indigo-600 transition-colors">
                    {label}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                    {desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. HOW CAMPUS CART WORKS (REAL, PRACTICAL STUDENT STEPS) */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--text-primary)]">
            How CampusCart Works
          </h2>
          <p className="text-[var(--text-muted)] text-sm sm:text-base mt-2">
            No shipping fees, no waiting for couriers, no stranger danger. Simple student-to-student exchange.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map(({ num, title, desc }) => (
            <div
              key={title}
              className="flex flex-col gap-3 p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] shadow-2xs hover:shadow-xs transition-shadow"
            >
              <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-600 text-white text-xs font-extrabold">
                {num}
              </span>
              <h3 className="font-bold text-base text-[var(--text-primary)]">
                {title}
              </h3>
              <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. CAMPUS SAFETY & STUDENT VERIFICATION BANNER */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
        <div className="rounded-2xl p-6 sm:p-8 bg-[var(--card-bg)] border border-[var(--border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
              <span>Safe Campus Trading</span>
            </div>
            <h3 className="font-bold text-lg sm:text-xl text-[var(--text-primary)]">
              Exclusive to Verified IKGPTU Students
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              Verify your student identity using your PTU roll number or portal to get your verified student badge and build instant trust with buyers and sellers.
            </p>
          </div>
          <Link href="/student-verification" className="shrink-0">
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2.5 text-xs font-semibold"
            >
              Get Verified →
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
