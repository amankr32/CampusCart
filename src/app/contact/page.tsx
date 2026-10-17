import type { Metadata } from "next";
import { Mail } from "lucide-react";

import { StaticPage } from "@/components/layout/static-page";

export const metadata: Metadata = {
  title: "Contact — Campus Cart",
  description: "Get in touch with the Campus Cart team.",
};

// TODO: replace with your real support inbox before launch.
const SUPPORT_EMAIL = "amankumar.cs27@gmail.com";

export default function ContactPage() {
  return (
    <StaticPage
      title="Contact us"
      subtitle="Questions, problems, or ideas — we'd like to hear them."
    >
      <p>
        Whether something&apos;s not working, a listing looks off, or you
        just have a suggestion, the fastest way to reach us is by email.
        We&apos;re students too, so replies might take a day or so during
        exam season.
      </p>

      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] text-[var(--text-primary)] w-fit hover:border-[var(--brand-primary)]/40 hover:shadow-md transition-all"
      >
        <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
          <Mail className="h-5 w-5" />
        </span>
        <span className="font-semibold text-sm">{SUPPORT_EMAIL}</span>
      </a>

      <p className="text-sm text-[var(--text-muted)]">
        For anything involving a specific order, include the listing name
        and roughly when you bought or listed it — it helps us track things
        down faster.
      </p>
    </StaticPage>
  );
}
