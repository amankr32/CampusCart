"use client";

import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMessages = pathname.startsWith("/dashboard/messages");

  if (isMessages) {
    return <div className="flex-1 flex flex-col w-full">{children}</div>;
  }

  return (
    <div className="flex flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
    </div>
  );
}