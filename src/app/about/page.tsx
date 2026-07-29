import type { Metadata } from "next";

import { StaticPage } from "@/components/layout/static-page";

export const metadata: Metadata = {
  title: "About — Campus Cart",
  description: "Why Campus Cart exists and how it works for IK Gujral Punjab University students.",
};

export default function AboutPage() {
  return (
    <StaticPage
      title="Our story"
      subtitle="A marketplace that starts and ends on campus."
    >
      <p>
        Every semester, the same thing happens. Final-year students pack up
        and leave behind textbooks, table lamps, cycles, and hostel
        essentials that still have years of use left in them. Meanwhile,
        first-years are buying all of it new, often paying full price for
        things they&apos;ll use for a semester or two.
      </p>
      <p>
        Campus Cart exists to close that gap. It&apos;s a marketplace built
        specifically for IK Gujral Punjab University students to buy and
        sell directly with each other — no shipping, no strangers off the
        internet, no listing fees. Just people on the same campus, passing
        things on.
      </p>
      <p>
        We keep it simple on purpose: sign up with your student email, list
        what you&apos;re done with, browse what you need, and meet up on
        campus to make the trade. That&apos;s it.
      </p>
      <p>
        Campus Cart is an independent, student-built project — not an official
        university platform.
      </p>
    </StaticPage>
  );
}
