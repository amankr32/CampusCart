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
        className="flex items-center gap-3 p-4 rounded-lg border-2 border-black bg-white w-fit hover:bg-black/5 transition-colors"
      >
        <span className="flex items-center justify-center h-10 w-10 rounded-full bg-[var(--brand-yellow)] border-2 border-black">
          <Mail className="h-4 w-4" />
        </span>
        <span className="font-medium">{SUPPORT_EMAIL}</span>
      </a>

      <p className="text-sm text-black/50">
        For anything involving a specific order, include the listing name
        and roughly when you bought or listed it — it helps us track things
        down faster.
      </p>
    </StaticPage>
  );
}
