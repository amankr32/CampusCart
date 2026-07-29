import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Placeholder sources used for seed/demo data and local testing.
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      // Real listing photos, uploaded via the Vercel Blob integration
      // wired up in Phase 3 (src/app/api/upload/route.ts).
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  experimental: {
    // Only the icons actually used on a given page get bundled, instead of
    // pulling in the whole lucide-react package on every route.
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
