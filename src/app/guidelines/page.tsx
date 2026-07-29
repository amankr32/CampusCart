import type { Metadata } from "next";

import { StaticPage } from "@/components/layout/static-page";

export const metadata: Metadata = {
  title: "Community guidelines — PTU Bazar",
  description: "What's allowed and not allowed on PTU Bazar.",
};

export default function GuidelinesPage() {
  return (
    <StaticPage
      title="Community guidelines"
      subtitle="PTU Bazar works because it's small and trusted. These rules keep it that way."
    >
      <div>
        <h2 className="font-display font-semibold text-black mb-2">
          List honestly
        </h2>
        <p>
          Describe an item&apos;s real condition, and use your own photos.
          If something is damaged or missing parts, say so — buyers on a
          campus this size will remember if you don&apos;t.
        </p>
      </div>

      <div>
        <h2 className="font-display font-semibold text-black mb-2">
          Only list what you can actually hand over
        </h2>
        <p>
          Don&apos;t list items you no longer have, or that belong to
          someone else without their say-so.
        </p>
      </div>

      <div>
        <h2 className="font-display font-semibold text-black mb-2">
          No prohibited items
        </h2>
        <p>
          No alcohol, drugs, weapons, exam material, counterfeit goods, or
          anything illegal to sell or possess. Listings like this get
          removed and may result in your account being suspended.
        </p>
      </div>

      <div>
        <h2 className="font-display font-semibold text-black mb-2">
          Treat other students with respect
        </h2>
        <p>
          Harassment, threats, or discriminatory behavior toward anyone on
          the platform isn&apos;t tolerated, in listings, messages, or
          reviews.
        </p>
      </div>

      <div>
        <h2 className="font-display font-semibold text-black mb-2">
          Reviews should be honest, not personal
        </h2>
        <p>
          Reviews exist to help other students, not to settle scores.
          Describe your actual experience with the item and the trade.
        </p>
      </div>

      <p className="text-sm text-black/50 pt-4 border-t border-black/10">
        Breaking these guidelines can result in a listing being taken down
        or an account being suspended. If you think a decision was made in
        error, reach out through the contact page.
      </p>
    </StaticPage>
  );
}
