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
} from "lucide-react";

import { Button } from "@/components/ui/button";

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
    title: "List in under two minutes",
    description:
      "Snap a photo, set your price, and post it. No fees to list, no fine print.",
  },
  {
    icon: MessageCircle,
    title: "Chat with a fellow student",
    description:
      "Every account is tied to a real student profile, so you know exactly who you're dealing with.",
  },
  {
    icon: Wallet,
    title: "Meet on campus, pay your way",
    description:
      "Hand it off at your hostel or block, and settle up in person or through the app.",
  },
];

const stats = [
  { value: "800+", label: "Students" },
  { value: "1200+", label: "Listings" },
  { value: "100%", label: "Verified" },
  { value: "₹5 Lakh+", label: "Saved by Students" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-[var(--border-subtle)] bg-gradient-to-b from-[var(--brand-orange-light)] to-white">
        <div className="w-full px-4 lg:px-12 py-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide bg-white border border-[var(--border-subtle)] rounded-full px-3 py-1.5 mb-6 shadow-[var(--shadow-cartoon-sm)]">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand-orange)]" />
              For IK Gujral Punjab University students
            </p>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight mb-6">
              Buy &amp; Sell Everything{" "}
              <span className="text-[var(--brand-orange)]">
                Within IKGPTU Campus
              </span>
            </h1>
            <p className="text-lg leading-relaxed text-black/60 max-w-xl mb-8">
              From books to bicycles, laptops to hostel essentials — find it
              all with fellow verified IKGPTU students.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link href="/browse">
                <Button variant="default" size="lg" className="w-full sm:w-auto">
                  Browse listings
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sell">
                <Button variant="elevated" size="lg" className="w-full sm:w-auto">
                  Start selling
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-xl">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-display font-bold text-2xl text-[var(--brand-orange)]">
                    {stat.value}
                  </p>
                  <p className="text-xs text-black/50">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="w-full px-4 lg:px-12 py-16">
        <h2 className="font-display font-bold text-2xl sm:text-3xl mb-2">
          Shop by category
        </h2>
        <p className="text-black/60 mb-8">
          Find what you need without leaving campus.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map(({ icon: Icon, label, href }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col items-start gap-4 p-6 rounded-xl border border-[var(--border-subtle)] bg-white shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5"
            >
              <span className="flex items-center justify-center h-11 w-11 rounded-lg bg-[var(--brand-orange-light)] text-[var(--brand-orange)]">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-black/[0.02] border-y border-[var(--border-subtle)]">
        <div className="w-full px-4 lg:px-12 py-16">
          <h2 className="font-display font-bold text-2xl sm:text-3xl mb-2">
            How Campus Cart works
          </h2>
          <p className="text-black/60 mb-10">
            Three steps, no middlemen, no surprises.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map(({ icon: Icon, title, description }, index) => (
              <div
                key={title}
                className="flex flex-col gap-3 p-6 rounded-xl bg-white border border-[var(--border-subtle)] shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-9 w-9 rounded-full bg-[var(--brand-orange)] text-white text-sm font-semibold">
                    {index + 1}
                  </span>
                  <Icon className="h-5 w-5 text-[var(--brand-orange)]" strokeWidth={2} />
                </div>
                <h3 className="font-display font-semibold text-lg">{title}</h3>
                <p className="text-black/60 text-sm leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="w-full px-4 lg:px-12 py-16">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-8 rounded-xl bg-[var(--brand-black)] text-white">
          <ShieldCheck className="h-10 w-10 shrink-0 text-[var(--brand-orange)]" />
          <div>
            <h2 className="font-display font-semibold text-xl mb-2">
              Built for this campus, not the whole internet
            </h2>
            <p className="text-white/70 max-w-2xl">
              Every seller on Campus Cart signs up with their student email, so
              you&apos;re always buying from someone who actually studies here
              — not a stranger from across the country.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full px-4 lg:px-12 pb-20">
        <div className="flex flex-col items-center text-center gap-4 py-16 px-6 rounded-xl bg-gradient-to-br from-[var(--brand-orange)] to-[var(--brand-orange-dark)] text-white">
          <h2 className="font-display font-bold text-2xl sm:text-3xl max-w-lg">
            Got things gathering dust in your hostel room?
          </h2>
          <p className="text-white/80 max-w-md">
            Turn them into pocket money before someone else&apos;s semester
            starts.
          </p>
          <Link href="/sell">
            <Button
              size="lg"
              className="bg-white text-[var(--brand-orange)] hover:bg-white/90"
            >
              List your first item
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
