
"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMessages = pathname.startsWith("/dashboard/messages");

  if (isMessages) {
    return <div className="flex-1 flex flex-col w-full">{children}</div>;
  }

  return (
    <div className="flex flex-1 w-full max-w-(--breakpoint-xl) mx-auto">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
    </div>
  );
}