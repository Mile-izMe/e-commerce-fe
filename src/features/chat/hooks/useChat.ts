"use client";

import { useEffect, useState } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { io } from "socket.io-client";
import { useAuthStore } from "@/store";
import { refreshSession } from "@/src/shared/lib/auth-session";
import { chatApi } from "../api/chat.api";
import { ChatConnection } from "../lib/chat-connection";
import { mergeMessages } from "../lib/messages";
import {
  TypingEvent,
  type ChatMessage,
  type ConnectionState,
  type TypingState,
} from "../types";

export const chatKeys = {
  guilds: (userId: string) => ["chat", userId, "guilds"] as const,
  channels: (userId: string, guildId: string) =>
    ["chat", userId, "channels", guildId] as const,
  history: (userId: string, channelId: string) =>
    ["chat", userId, "history", channelId] as const,
  live: (userId: string, channelId: string) =>
    ["chat", userId, "live", channelId] as const,
};

export function useGuilds(userId: string) {
  return useQuery({
    queryKey: chatKeys.guilds(userId),
    queryFn: chatApi.guilds,
  });
}

export function useChannels(userId: string, guildId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.channels(userId, guildId ?? ""),
    queryFn: () => chatApi.channels(guildId!),
    enabled: !!guildId,
  });
}

export function useMessages(userId: string, channelId: string, ready: boolean) {
  const history = useInfiniteQuery({
    queryKey: chatKeys.history(userId, channelId),
    queryFn: ({ pageParam }) => chatApi.history(channelId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) =>
      page.meta.hasMore ? (page.meta.nextCursor ?? undefined) : undefined,
    enabled: ready,
  });
  const live = useQuery<ChatMessage[]>({
    queryKey: chatKeys.live(userId, channelId),
    queryFn: async () => [],
    initialData: [],
    enabled: false,
  });
  return {
    history,
    messages: mergeMessages(
      ...(history.data?.pages.map((page) => page.items) ?? []),
      live.data,
    ),
  };
}

// One connection per mounted workspace/session. Token rotation does not recreate it.
export function useChatConnection(
  userId: string,
  sessionVersion: number,
  channelId: string | null,
) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ConnectionState>({
    status: "connecting",
    channelId: null,
    error: null,
  });

  const [typingUsers, setTypingUsers] = useState<TypingState>({});
  const handleUserTyping = (payload: TypingEvent) => {
    if (payload.isTyping === true) {
      setTypingUsers((prev) => ({
        ...prev,
        [payload.userId]: {
          channelId: payload.channelId,
          isTyping: true,
          userName: payload.userName,
          expiresAt: Date.now() + 5000,
        },
      }));
    } else {
      setTypingUsers((prev) => {
        const newState = { ...prev };
        delete newState[payload.userId];
        return newState;
      });
    }
  };
  // {
  // {"user-A": { channelId: 1, isTyping: true, userName: ABC } },
  // {"user-B": { channelId: 1, isTyping: true, userName: BCD } },
  // }

  const currentTypers = Object.values(typingUsers)
    .filter((user) => user.channelId === channelId)
    .map((user) => user.userName);

  const [connection] = useState(
    () =>
      new ChatConnection({
        socket: io(
          `${(process.env.NEXT_PUBLIC_CHAT_URL ?? "http://localhost:3001").replace(/\/$/, "")}/chat`,
          {
            transports: ["websocket"],
            autoConnect: false,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
          },
        ),
        getToken: () => useAuthStore.getState().accessToken,
        isCurrentSession: () => {
          const current = useAuthStore.getState();
          return (
            current.user?.id === userId &&
            current.sessionVersion === sessionVersion
          );
        },
        refresh: refreshSession,
        onState: (nextState) => {
          setState(nextState);
          // Đổi channel báo joining; mất mạng/reconnect cũng rời ready.
          // Xóa entry cũ ngay để không hiện lại khi quay về phòng hoặc reconnect.
          if (nextState.status !== "ready") {
            setTypingUsers((prev) => (Object.keys(prev).length ? {} : prev));
          }
        },
        onMessage: (message) =>
          queryClient.setQueryData<ChatMessage[]>(
            chatKeys.live(userId, message.channelId),
            (current = []) => mergeMessages(current, [message]),
          ),
        onTyping: handleUserTyping,
        onRoomReady: (id) => {
          void queryClient.invalidateQueries({
            queryKey: chatKeys.history(userId, id),
          });
        },
      }),
  );

  /*
  TTL để handle trường hợp đang gõ thì bị crash mạng, sập server -> Tránh infinite typing
  Mỗi người có 1 thời điểm hết hạn: userA: 0s -> 5s, userB: 2s -> 7s
  */
  useEffect(() => {
    // Tạo 1 timer chạy mỗi 1s để quét + dọn dẹp user ngừng typing (Garbage Collector)
    const timer = setInterval(() => {
      const now = Date.now();
      // Điều kiện: Nếu expiresAt > now => giữ nguyên
      // expiresAt < now => xóa user đó
      setTypingUsers((prev) => {
        let hasChanged = false;
        const newState = { ...prev };

        for (const [key, data] of Object.entries(newState)) {
          if (data.expiresAt <= now) {
            delete newState[key];
            hasChanged = true;
          }
        }

        return hasChanged ? newState : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    connection.start();
    return () => connection.close();
  }, [connection]);

  useEffect(() => {
    connection.selectChannel(channelId);
  }, [connection, channelId]);

  return { connection, state, currentTypers };
}
