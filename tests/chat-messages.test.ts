import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPublishChatEvent = vi.fn();

vi.mock("server-only", () => ({}));

vi.mock("@/lib/chat-events", () => ({
  publishChatEvent: (...args: unknown[]) => mockPublishChatEvent(...args),
}));

const mockSelectLimit = vi.fn();
const mockUpdateReturning = vi.fn();
const mockUpdateWhere = vi.fn();

vi.mock("@/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => mockSelectLimit(),
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: (...args: unknown[]) => {
          mockUpdateWhere(...args);
          return {
            returning: () => mockUpdateReturning(),
          };
        },
      }),
    }),
  },
}));

import {
  deleteMessageForEveryone,
  deleteMessageForMe,
  editMessage,
} from "@/db/queries/messages";

describe("Message Edit & Delete Queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("editMessage", () => {
    it("rejects editing another user's message", async () => {
      mockSelectLimit.mockResolvedValue([
        {
          id: "m1",
          conversationId: "c1",
          senderId: "user-other",
          type: "text",
          deletedForEveryoneAt: null,
        },
      ]);

      const res = await editMessage({
        conversationId: "c1",
        messageId: "m1",
        userId: "user-1",
        message: "Updated text",
      });

      expect(res).toEqual({
        error: "You can only edit your own messages.",
        status: 403,
      });
      expect(mockPublishChatEvent).not.toHaveBeenCalled();
    });

    it("edits own message and publishes message_updated event", async () => {
      const updated = {
        id: "m1",
        conversationId: "c1",
        senderId: "user-1",
        type: "text",
        message: "Updated text",
        editedAt: new Date("2026-11-26T00:00:00Z"),
      };
      mockSelectLimit.mockResolvedValue([
        {
          id: "m1",
          conversationId: "c1",
          senderId: "user-1",
          type: "text",
          deletedForEveryoneAt: null,
        },
      ]);
      mockUpdateReturning.mockResolvedValue([updated]);

      const res = await editMessage({
        conversationId: "c1",
        messageId: "m1",
        userId: "user-1",
        message: "Updated text",
      });

      expect(res).toEqual({ message: updated });
      expect(mockPublishChatEvent).toHaveBeenCalledWith("c1", {
        type: "message_updated",
        data: updated,
      });
    });
  });

  describe("deleteMessageForMe", () => {
    it("adds userId to deletedByUserIds without publishing globally", async () => {
      mockSelectLimit.mockResolvedValue([
        { id: "m1", deletedByUserIds: [] },
      ]);

      const res = await deleteMessageForMe({
        conversationId: "c1",
        messageId: "m1",
        userId: "user-1",
      });

      expect(res).toEqual({ ok: true });
      expect(mockUpdateWhere).toHaveBeenCalledTimes(1);
      expect(mockPublishChatEvent).not.toHaveBeenCalled();
    });
  });

  describe("deleteMessageForEveryone", () => {
    it("rejects deleting another user's message for everyone", async () => {
      mockSelectLimit.mockResolvedValue([
        {
          id: "m1",
          conversationId: "c1",
          senderId: "user-other",
          type: "text",
          image: null,
        },
      ]);

      const res = await deleteMessageForEveryone({
        conversationId: "c1",
        messageId: "m1",
        userId: "user-1",
      });

      expect(res).toEqual({
        error: "You can only delete your own messages for everyone.",
        status: 403,
      });
      expect(mockPublishChatEvent).not.toHaveBeenCalled();
    });

    it("clears message content, returns previousImage, and publishes message_updated", async () => {
      const updated = {
        id: "m1",
        conversationId: "c1",
        senderId: "user-1",
        type: "text",
        message: null,
        image: null,
        deletedForEveryoneAt: new Date("2026-11-26T00:00:00Z"),
      };
      mockSelectLimit.mockResolvedValue([
        {
          id: "m1",
          conversationId: "c1",
          senderId: "user-1",
          type: "text",
          image: "https://abc.public.blob.vercel-storage.com/photo.png",
        },
      ]);
      mockUpdateReturning.mockResolvedValue([updated]);

      const res = await deleteMessageForEveryone({
        conversationId: "c1",
        messageId: "m1",
        userId: "user-1",
      });

      expect(res).toEqual({
        message: updated,
        previousImage: "https://abc.public.blob.vercel-storage.com/photo.png",
      });
      expect(mockPublishChatEvent).toHaveBeenCalledWith("c1", {
        type: "message_updated",
        data: updated,
      });
    });
  });
});
