import { UserPlus, ListPlus, MessagesSquare, Handshake, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Create your account",
    body: "Sign up with your student email and verify your student identity.",
  },
  {
    icon: ListPlus,
    title: "List your item",
    body: "Add photos, write details, set the price and publish your listing in minutes.",
  },
  {
    icon: MessagesSquare,
    title: "Chat & agree",
    body: "Interested buyers will chat with you. Discuss, negotiate and agree on price.",
  },
  {
    icon: Handshake,
    title: "Meet on campus",
    body: "Meet at your hostel, block or any safe public place on campus.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-(--breakpoint-xl) mx-auto w-full px-4 lg:px-12 py-16">
      <div className="text-center mb-12">
        <h1 className="font-display font-bold text-3xl sm:text-4xl mb-4">
          How PTU Bazar works
        </h1>
        <p className="text-black/60 text-lg max-w-xl mx-auto">
          A simple and safe way to buy and sell within your campus community.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {steps.map(({ icon: Icon, title, body }, index) => (
          <div
            key={title}
            className="relative flex flex-col gap-3 p-6 rounded-xl border border-[var(--border-subtle)] bg-white shadow-[var(--shadow-card)]"
          >
            <span className="absolute -top-3 -right-3 flex items-center justify-center h-7 w-7 rounded-full bg-[var(--brand-orange)] text-white text-xs font-semibold">
              {index + 1}
            </span>
            <span className="flex items-center justify-center h-11 w-11 rounded-lg bg-[var(--brand-orange-light)] text-[var(--brand-orange)]">
              <Icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <h2 className="font-display font-semibold text-lg">{title}</h2>
            <p className="text-black/60 text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-6 rounded-xl bg-black/[0.02] border border-[var(--border-subtle)]">
        <ShieldCheck className="h-8 w-8 shrink-0 text-[var(--brand-orange)]" />
        <div>
          <h3 className="font-display font-semibold text-lg mb-1">
            Safe. Simple. Student to student.
          </h3>
          <p className="text-black/60 text-sm max-w-2xl">
            PTU Bazar is built only for verified students. No delivery, no
            middlemen — just genuine campus deals.
          </p>
        </div>
      </div>
    </div>
  );
}
