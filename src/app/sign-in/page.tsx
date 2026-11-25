import { ShieldCheck, MessageCircle, BadgePercent } from "@/components/ui/material-symbol";

import { SignInForm } from "@/components/auth/sign-in-form";

const perks = [
  {
    icon: ShieldCheck,
    title: "Verified Students Only",
    body: "Only IKGPTU students can buy and sell.",
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

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const params = await searchParams;
  const resetSuccess = params.reset === "true";

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-(--breakpoint-xl) mx-auto w-full px-4 lg:px-12 py-12 lg:py-20 items-center">
      <div className="hidden lg:flex flex-col gap-6">
        <h1 className="font-display font-bold text-4xl leading-tight text-[var(--text-primary)]">
          Welcome back!{" "}
          <span className="text-[var(--brand-primary)]">Good to see you</span>{" "}
          again 👋
        </h1>
        <p className="text-[var(--text-muted)] text-lg max-w-md">
          Sign in to continue buying and selling with verified IKGPTU students.
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
            Welcome back
          </h1>
          <p className="text-[var(--text-muted)]">
            Sign in to keep buying and selling on campus.
          </p>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm p-6 sm:p-8">
          <h2 className="font-display font-semibold text-xl mb-1 text-[var(--text-primary)]">
            Sign in to Campus Cart
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Enter your email and password to access your account.
          </p>
          <SignInForm resetSuccess={resetSuccess} />
        </div>
      </div>
    </div>
  );
}
