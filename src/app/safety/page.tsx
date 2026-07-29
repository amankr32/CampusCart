import type { Metadata } from "next";

import { StaticPage } from "@/components/layout/static-page";

export const metadata: Metadata = {
  title: "Safety on campus — Campus Cart",
  description: "Tips for buying and selling safely on Campus Cart.",
};

const TIPS = [
  {
    title: "Meet in public, on campus",
    body: "Hostel common rooms, canteens, or the main gate are all safer than an empty block or off-campus address, especially for a first meetup.",
  },
  {
    title: "Check the item before you pay",
    body: "If you're paying in person, inspect the item first. For anything paid through the app, that payment is already tied to a specific listing and seller.",
  },
  {
    title: "Keep the conversation on Campus Cart until you've met",
    body: "It gives you a record of what was agreed — price, condition, pickup time — in case anything needs sorting out later.",
  },
  {
    title: "Trust your instincts",
    body: "If a listing or a conversation feels off, it's fine to walk away. There's no obligation to complete a trade that doesn't feel right.",
  },
  {
    title: "Report anything that feels wrong",
    body: "Fake listings, harassment, or anything that violates our community guidelines — let us know through the contact page so we can look into it.",
  },
];

export default function SafetyPage() {
  return (
    <StaticPage
      title="Safety on campus"
      subtitle="A few habits that make trading on Campus Cart smoother and safer for everyone."
    >
      <div className="flex flex-col gap-4">
        {TIPS.map((tip) => (
          <div
            key={tip.title}
            className="p-5 rounded-lg border-2 border-black bg-white"
          >
            <h2 className="font-display font-semibold text-black mb-2">
              {tip.title}
            </h2>
            <p className="text-sm">{tip.body}</p>
          </div>
        ))}
      </div>
    </StaticPage>
  );
}
