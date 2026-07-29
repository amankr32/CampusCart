import type { Metadata } from "next";
import "./globals.css";

import { AppSessionProvider } from "@/components/providers/session-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "PTU Bazar — The student marketplace for IK Gujral Punjab University",
  description:
    "Buy, sell, and swap textbooks, hostel essentials, cycles, and gadgets with fellow IK Gujral Punjab University students. Verified campus community, zero listing fees.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AppSessionProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </AppSessionProvider>
      </body>
    </html>
  );
}
