import type { Metadata } from "next";
import "./globals.css";

import { auth } from "@/auth";
import { AppSessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CommandPalette } from "@/components/layout/command-palette";

import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: {
    default: "CampusCart — Student Marketplace for IKGPTU",
    template: "%s | CampusCart",
  },
  description:
    "Buy, sell, and swap textbooks, hostel essentials, cycles, drafters, and gadgets with fellow IK Gujral Punjab Technical University students. Verified student community, zero commission fees.",
  keywords: [
    "CampusCart",
    "IKGPTU",
    "Campus Marketplace",
    "Student Marketplace",
    "College textbooks",
    "Hostel essentials",
    "Cycles",
    "Jalandhar",
    "Kapurthala",
  ],
  authors: [{ name: "CampusCart Team" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "CampusCart",
    title: "CampusCart — Student Marketplace for IKGPTU",
    description:
      "Buy, sell, and swap textbooks, hostel essentials, cycles, and gadgets with fellow IK Gujral Punjab Technical University students.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusCart — Student Marketplace for IKGPTU",
    description:
      "Buy, sell, and swap textbooks, hostel essentials, cycles, and gadgets with fellow IK Gujral Punjab Technical University students.",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-slate-900 antialiased">
        <AppSessionProvider session={session}>
          <ThemeProvider>
            <Navbar />
            <main className="flex-1 flex flex-col w-full">{children}</main>
            <Footer />
            <CommandPalette />
            <Toaster />
          </ThemeProvider>
        </AppSessionProvider>
      </body>
    </html>
  );
}
