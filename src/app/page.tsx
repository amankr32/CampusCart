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

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-indigo-50/60 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-12 py-16 sm:py-24">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide bg-white border border-indigo-100 text-indigo-700 rounded-full px-4 py-1.5 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              Exclusive Marketplace for College Students
            </div>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.08] tracking-tight text-slate-900">
              The Safe Campus Marketplace for{" "}
              <span className="text-indigo-600 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
                Books, Electronics &amp; Essentials
              </span>
            </h1>
            <p className="text-lg leading-relaxed text-slate-600 max-w-2xl">
              Buy, sell, and swap textbooks, calculators, hostel gear, cycles, and gadgets exclusively with verified fellow university students. Zero listing fees, 100% email OTP verified.
            </p>
            <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
              <Link href="/browse">
                <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-12 px-8 font-semibold shadow-lg shadow-indigo-100">
                  Browse Campus Gear
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/sell">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-200 hover:bg-slate-50 text-slate-800 rounded-2xl h-12 px-8 font-semibold">
                  Start Selling Now
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 max-w-2xl border-t border-slate-100">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-display font-bold text-2xl text-indigo-600">
                    {stat.value}
                  </p>
                  <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Student Verification & Trust System Highlight */}
      <section className="max-w-7xl mx-auto px-4 lg:px-12 py-12">
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-400/30">
              <Award className="w-4 h-4 text-indigo-400" /> Student Verification & Anti-Fraud Engine
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight leading-snug">
              Get Verified & Unlock Unlimited Selling Privileges
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Verify your student identity using your PTU Portal to receive your Verified Student Badge, higher trust rank, and unlimited product listings!
            </p>
          </div>
          <Link href="/student-verification" className="shrink-0">
            <Button size="lg" className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl h-12 px-7 font-bold shadow-lg shadow-indigo-900/50">
              Get Verified Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 lg:px-12 py-12">
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 mb-2">
          Shop by Student Category
        </h2>
        <p className="text-slate-600 mb-8 text-sm sm:text-base">
          Find essential semester tools right on your campus.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map(({ icon: Icon, label, href }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col items-start gap-4 p-6 rounded-3xl border border-slate-200 bg-white shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <span className="flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Icon className="h-6 w-6" strokeWidth={2} />
              </span>
              <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-12 py-16">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 mb-2">
            How Campus Cart Works
          </h2>
          <p className="text-slate-600 mb-10 text-sm sm:text-base">
            Three simple steps designed for quick offline handoffs on campus.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map(({ icon: Icon, title, description }, index) => (
              <div
                key={title}
                className="flex flex-col gap-4 p-7 rounded-3xl bg-white border border-slate-200 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-9 w-9 rounded-full bg-indigo-600 text-white text-sm font-bold">
                    {index + 1}
                  </span>
                  <Icon className="h-6 w-6 text-indigo-600" strokeWidth={2} />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
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
