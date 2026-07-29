import Link from "next/link";
import { ShieldCheck, MessageCircle, BadgePercent } from "lucide-react";

import { SignInForm } from "@/components/auth/sign-in-form";

const perks = [
  {
    icon: ShieldCheck,
    title: "Verified Students Only",
    body: "Only PTU students can buy and sell.",
  },
  {
    icon: MessageCircle,
    title: "Safe & Secure",
    body: "Chat, meet and transact safely on campus.",
  },
  {
    icon: BadgePercent,
    title: "No Platform Fee",
    body: "Buy and sell without paying any extra charges.",
  },
];

export default function SignInPage() {
  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-(--breakpoint-xl) mx-auto w-full px-4 lg:px-12 py-12 lg:py-20 items-center">
      <div className="hidden lg:flex flex-col gap-6">
        <h1 className="font-display font-bold text-4xl leading-tight">
          Welcome back!{" "}
          <span className="text-[var(--brand-orange)]">Good to see you</span>{" "}
          again 👋
        </h1>
        <p className="text-black/60 text-lg max-w-md">
          Sign in to continue buying and selling with verified PTU students.
        </p>
        <div className="flex flex-col gap-4 mt-2">
          {perks.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="flex items-center justify-center h-9 w-9 rounded-lg bg-[var(--brand-orange-light)] text-[var(--brand-orange)] shrink-0">
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <div>
                <p className="font-medium text-sm">{title}</p>
                <p className="text-sm text-black/50">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6 lg:hidden">
          <h1 className="font-display font-bold text-3xl mb-2">
            Welcome back
          </h1>
          <p className="text-black/60">
            Sign in to keep buying and selling on campus.
          </p>
        </div>

        <div className="border border-[var(--border-subtle)] rounded-xl bg-white shadow-[var(--shadow-card)] p-6 sm:p-8">
          <h2 className="font-display font-semibold text-xl mb-1">
            Sign in to PTU Bazar
          </h2>
          <p className="text-sm text-black/50 mb-6">
            Enter your student email and password to access your account.
          </p>
          <SignInForm />
        </div>

        <p className="text-center text-sm text-black/60 mt-6">
          New to PTU Bazar?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-[var(--brand-orange)] hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
