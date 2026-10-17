import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/profile/settings-client";

export const metadata = {
  title: "Settings — CampusCart",
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/settings");
  }

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[var(--background)] px-4 sm:px-8 lg:px-12 py-10">
      <SettingsClient user={{ name: session.user.name ?? "", email: session.user.email ?? "" }} />
    </div>
  );
}
