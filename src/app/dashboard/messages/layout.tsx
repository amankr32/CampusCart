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
    <div className="flex h-[calc(100vh-5rem)] max-w-(--breakpoint-xl) mx-auto">
      <ConversationSidebar
        initialConversations={conversations}
        currentUserId={session.user.id}
      />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
