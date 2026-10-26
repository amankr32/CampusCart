import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CampusCart — IKGPTU Student Marketplace",
    short_name: "CampusCart",
    description:
      "Buy, sell, and swap textbooks, hostel essentials, cycles, and gadgets with fellow IK Gujral Punjab Technical University students.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f172a",
    theme_color: "#4f46e5",
    categories: ["shopping", "education", "lifestyle"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
