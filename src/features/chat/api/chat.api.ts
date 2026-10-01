import { requestCursorPage, requestData } from "@/src/shared/lib/api";
import type { Channel, ChatMessage, Guild } from "../types";

export const chatApi = {
  guilds: () =>
    requestData<Guild[]>({
      method: "GET",
      url: "/chat/guilds",
      requiresAuth: true,
    }),
  createGuild: (name: string) =>
    requestData<Guild>({
      method: "POST",
      url: "/chat/guilds",
      data: { name },
      requiresAuth: true,
    }),
  channels: (guildId: string) =>
    requestData<Channel[]>({
      method: "GET",
      url: `/chat/guilds/${guildId}/channels`,
      requiresAuth: true,
    }),
  createChannel: (guildId: string, name: string) =>
    requestData<Channel>({
      method: "POST",
      url: `/chat/guilds/${guildId}/channels`,
      data: { name },
      requiresAuth: true,
    }),
  addMember: (guildId: string, userId: string) =>
    requestData<{ userId: string; guildId: string }>({
      method: "POST",
      url: `/chat/guilds/${guildId}/members`,
      data: { userId },
      requiresAuth: true,
    }),
  history: (channelId: string, cursor?: string) =>
    requestCursorPage<ChatMessage>({
      method: "GET",
      url: `/chat/channels/${channelId}/messages`,
      params: { limit: 30, cursor },
      requiresAuth: true,
    }),
};
