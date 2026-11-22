import { auth } from "@/auth";
import { listConversationsForUser } from "@/db/queries/messages";
import { ConversationSidebar } from "@/components/messaging/conversation-sidebar";

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const conversations = await listConversationsForUser(session.user.id);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex h-[calc(100vh-9rem)] min-h-[520px] w-full">
        <ConversationSidebar
          initialConversations={conversations}
          currentUserId={session.user.id}
        />
        <div className="flex-1 min-w-0 flex flex-col h-full bg-white dark:bg-slate-900">{children}</div>
      </div>
    </div>
  );
}

