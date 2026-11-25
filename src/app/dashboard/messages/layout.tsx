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
    <div className="w-full max-w-[1600px] mx-auto px-0 md:px-8 lg:px-12 py-0 md:py-6">
      <div className="bg-white border-0 md:border border-slate-200 rounded-none md:rounded-2xl shadow-none md:shadow-sm overflow-hidden flex h-[calc(100dvh-3.5rem)] md:h-[calc(100vh-9rem)] md:min-h-[520px] w-full">
        <ConversationSidebar
          initialConversations={conversations}
          currentUserId={session.user.id}
        />
        <div className="flex-1 min-w-0 flex flex-col h-full bg-white">{children}</div>
      </div>
    </div>
  );
}

