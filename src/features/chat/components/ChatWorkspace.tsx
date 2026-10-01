"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Menu, MessageCircle, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { UserType } from "@/src/features/auth/types";
import { chatApi } from "../api/chat.api";
import {
  chatKeys,
  useChannels,
  useChatConnection,
  useGuilds,
} from "../hooks/useChat";
import type { Channel, Guild } from "../types";
import { ChannelSidebar } from "./ChannelSidebar";
import { Conversation } from "./Conversation";
import { GuildRail } from "./GuildRail";
import { ResourceDialog } from "./ResourceDialog";
import type { ResourceAction } from "./ResourceDialog";

export function ChatWorkspace({
  user,
  sessionVersion,
}: {
  user: UserType;
  sessionVersion: number;
}) {
  const client = useQueryClient();
  const [selectedGuild, setSelectedGuild] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [action, setAction] = useState<ResourceAction | null>(null);
  const guilds = useGuilds(user.id);
  const guild =
    guilds.data?.find((item) => item.id === selectedGuild) ?? guilds.data?.[0];
  const channels = useChannels(user.id, guild?.id);
  const channel =
    channels.data?.find((item) => item.id === selectedChannel) ??
    channels.data?.[0];
  const { connection, state, currentTypers } = useChatConnection(
    user.id,
    sessionVersion,
    channel?.id ?? null,
  );

  const isOwner = guild?.ownerId === user.id;
  const userName = user.name?.trim() || user.username || user.email;

  const create = useMutation({
    mutationFn: async ({
      action,
      value,
    }: {
      action: ResourceAction;
      value: string;
    }) => {
      if (action === "guild") {
        const created = await chatApi.createGuild(value);
        client.setQueryData<Guild[]>(
          chatKeys.guilds(user.id),
          (current = []) => [...current, created],
        );
        setSelectedGuild(created.id);
        setSelectedChannel(null);
        setNavigationOpen(true);
      } else if (guild && action === "channel") {
        const created = await chatApi.createChannel(guild.id, value);
        client.setQueryData<Channel[]>(
          chatKeys.channels(user.id, guild.id),
          (current = []) => [...current, created],
        );
        setSelectedChannel(created.id);
        setNavigationOpen(false);
      } else if (guild) {
        await chatApi.addMember(guild.id, value);
        toast.success("Đã thêm thành viên vào guild");
      }
    },
  });

  return (
    <main className="mx-auto w-full max-w-[1480px] p-2 sm:p-4">
      <div className="relative flex h-[calc(100dvh-164px)] min-h-[520px] overflow-hidden rounded-2xl border border-line bg-surface lg:h-[calc(100dvh-112px)] lg:rounded-3xl">
        <GuildRail
          guilds={guilds.data ?? []}
          activeId={guild?.id}
          onCreate={() => setAction("guild")}
          onSelect={(id) => {
            setSelectedGuild(id);
            setSelectedChannel(null);
            setNavigationOpen(true);
          }}
        />
        {navigationOpen && (
          <button
            onClick={() => setNavigationOpen(false)}
            aria-label="Đóng điều hướng"
            className="absolute inset-0 left-14 z-10 bg-black/30 backdrop-blur-[2px] sm:left-[72px] lg:hidden"
          />
        )}
        <div
          className={`shrink-0 border-r border-line ${navigationOpen ? "absolute inset-y-0 left-14 z-20 flex shadow-xl sm:left-[72px] lg:static lg:shadow-none" : "hidden lg:flex"}`}
        >
          <ChannelSidebar
            guild={guild}
            channels={channels.data ?? []}
            channelId={channel?.id}
            isOwner={isOwner}
            loading={channels.isLoading}
            error={channels.isError}
            userId={user.id}
            userName={userName}
            onSelect={(id) => {
              setSelectedChannel(id);
              setNavigationOpen(false);
            }}
            onCreate={() => setAction("channel")}
            onAddMember={() => setAction("member")}
            onRetry={() => {
              void channels.refetch();
            }}
            onClose={() => setNavigationOpen(false)}
          />
        </div>
        {channel ? (
          <Conversation
            key={channel.id}
            channel={channel}
            userId={user.id}
            userName={userName}
            state={state}
            currentTypers={currentTypers}
            connection={connection}
            onOpenNavigation={() => setNavigationOpen(true)}
          />
        ) : (
          <section className="flex min-w-0 flex-1 flex-col bg-background">
            <div className="flex items-center gap-3 border-b border-line p-4">
              <button
                onClick={() => setNavigationOpen(true)}
                aria-label="Mở danh sách channel"
                className="text-muted lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="text-xs text-muted">
                ATELIER / KHÔNG GIAN TRÒ CHUYỆN
              </span>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
              <MessageCircle
                className="mb-6 h-10 w-10 text-accent"
                strokeWidth={1}
              />
              <p className="mb-3 text-[10px] tracking-[0.2em] text-subtle">
                A LITTLE ROOM FOR IDEAS
              </p>
              <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
                {guilds.isLoading
                  ? "Đang mở không gian…"
                  : guild
                    ? "Bắt đầu một cuộc trò chuyện."
                    : "Một nơi để kết nối."}
              </h1>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
                {guild
                  ? "Chọn một channel ở bên trái hoặc tạo channel đầu tiên cho guild."
                  : "Tạo một guild, thêm những người bạn và dành một channel cho mỗi chủ đề."}
              </p>
              {guilds.isError || channels.isError ? (
                <button
                  onClick={() => {
                    void guilds.refetch();
                    if (guild) void channels.refetch();
                  }}
                  className="mt-7 flex items-center gap-2 rounded-full border border-line px-5 py-3 text-sm"
                >
                  <RefreshCw className="h-4 w-4" /> Tải lại danh sách
                </button>
              ) : (
                !guilds.isLoading &&
                (!guild || isOwner) && (
                  <button
                    onClick={() => setAction(guild ? "channel" : "guild")}
                    className="cursor-pointer mt-7 flex items-center gap-2 rounded-full bg-action px-5 py-3 text-sm text-action-foreground"
                  >
                    <Plus className="h-4 w-4" />{" "}
                    {guild ? "Tạo channel đầu tiên" : "Tạo guild đầu tiên"}
                  </button>
                )
              )}
              <button
                onClick={() => {
                  void guilds.refetch();
                }}
                className="cursor-pointer mt-5 text-xs text-subtle underline underline-offset-4"
              >
                Đã được mời? Làm mới danh sách guild
              </button>
            </div>
          </section>
        )}
      </div>
      {action && (
        <ResourceDialog
          key={action}
          action={action}
          onClose={() => setAction(null)}
          onSubmit={async (value) => {
            await create.mutateAsync({ action, value });
          }}
        />
      )}
    </main>
  );
}
