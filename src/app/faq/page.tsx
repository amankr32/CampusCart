import type { Metadata } from "next";

import { StaticPage } from "@/components/layout/static-page";

export const metadata: Metadata = {
  title: "FAQs — PTU Bazar",
  description: "Common questions about buying and selling on PTU Bazar.",
};

const FAQS = [
  {
    question: "Who can use PTU Bazar?",
    answer:
      "Any IK Gujral Punjab University student can sign up and start browsing or selling. You'll need a student email to create an account.",
  },
  {
    question: "Is it free to list something?",
    answer:
      "Yes. There's no fee to create a listing, and no fee when an item sells — PTU Bazar doesn't process any payments.",
  },
  {
    question: "How do I get paid when something sells?",
    answer:
      "Directly, in person. Buyers pay sellers offline — cash or UPI — when they meet to hand over the item. PTU Bazar never handles or holds your money.",
  },
  {
    question: "How do I meet the buyer or seller?",
    answer:
      "PTU Bazar doesn't handle delivery. Message each other to agree on a time and place — most people meet at a hostel block or a common spot on campus.",
  },
  {
    question: "What if an item isn't as described?",
    answer:
      "Talk to the seller first — most issues get sorted out directly. If that doesn't work, reach out through the contact page and we'll help mediate.",
  },
  {
    question: "Can I edit or remove a listing after posting it?",
    answer:
      "Yes, from your dashboard you can edit any listing's details or unpublish it at any time.",
  },
];

export default function FaqPage() {
  return (
    <StaticPage title="Frequently asked questions">
      <div className="flex flex-col gap-4">
        {FAQS.map((faq) => (
          <div
            key={faq.question}
            className="p-5 rounded-lg border-2 border-black bg-white"
          >
            <h2 className="font-display font-semibold text-black mb-2">
              {faq.question}
            </h2>
            <p className="text-sm">{faq.answer}</p>
          </div>
        ))}
      </div>
    </StaticPage>
  );
}
