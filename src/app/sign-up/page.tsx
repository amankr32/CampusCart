import { ShieldCheck, Users, BadgePercent } from "lucide-react";

import { SignUpForm } from "@/components/auth/sign-up-form";

const perks = [
  {
    icon: ShieldCheck,
    title: "Verified Students Only",
    body: "Only IKGPTU students can buy and sell.",
  },
  {
    icon: Users,
    title: "Safe & Trustworthy",
    body: "Chat, meet and transact safely on campus.",
  },
  {
    icon: BadgePercent,
    title: "No Platform Fee",
    body: "Buy and sell without paying any extra charges.",
  },
];

export default function SignUpPage() {
  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-(--breakpoint-xl) mx-auto w-full px-4 lg:px-12 py-12 lg:py-20 items-center">
      <div className="hidden lg:flex flex-col gap-6">
        <h1 className="font-display font-bold text-4xl leading-tight text-[var(--text-primary)]">
          Join <span className="text-[var(--brand-primary)]">Campus Cart</span>
          <br />
          Start buying &amp; selling on campus 👋
        </h1>
        <p className="text-[var(--text-muted)] text-lg max-w-md">
          Create your account in less than a minute and connect with verified
          IKGPTU students.
        </p>
        <div className="flex flex-col gap-4 mt-2">
          {perks.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="flex items-center justify-center h-9 w-9 rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] shrink-0">
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <div>
                <p className="font-semibold text-sm text-[var(--text-primary)]">{title}</p>
                <p className="text-sm text-[var(--text-muted)]">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6 lg:hidden">
          <h1 className="font-display font-bold text-3xl mb-2 text-[var(--text-primary)]">
            Join Campus Cart
          </h1>
          <p className="text-[var(--text-muted)]">
            Buy and sell with IK Gujral Punjab University students — set up
            your account in under a minute.
          </p>
        </div>

        <div className="border border-[var(--border-subtle)] rounded-3xl bg-[var(--card-bg)] shadow-xl p-6 sm:p-8">
          <h2 className="font-display font-semibold text-xl mb-1 text-[var(--text-primary)]">
            Create your account
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Fill in your details to get started.
          </p>
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
