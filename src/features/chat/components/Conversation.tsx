import { Hash, Menu, RefreshCw } from "lucide-react";
import { useMessages } from "../hooks/useChat";
import type { ChatConnection } from "../lib/chat-connection";
import type { Channel, ConnectionState } from "../types";
import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";
import { TypingIndicator } from "./MessageTypingIndicator";

const statuses = {
  connecting: "Đang kết nối",
  reconnecting: "Đang kết nối lại",
  joining: "Đang vào channel",
  ready: "Đã kết nối",
  offline: "Mất kết nối",
  error: "Chưa kết nối",
};

export function Conversation({
  channel,
  userId,
  userName,
  state,
  currentTypers,
  connection,
  onOpenNavigation,
}: {
  channel: Channel;
  userId: string;
  userName: string;
  state: ConnectionState;
  currentTypers: string[];
  connection: ChatConnection;
  onOpenNavigation: () => void;
}) {
  const ready = state.status === "ready" && state.channelId === channel.id;
  const { history, messages } = useMessages(userId, channel.id, ready);

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onOpenNavigation}
            aria-label="Mở danh sách channel"
            className="rounded-lg p-1 text-muted lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Hash className="hidden h-5 w-5 shrink-0 text-accent sm:block" />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">{channel.name}</h1>
            <p className="mt-1 truncate text-[11px] text-muted">
              {channel.description || "Nơi những ý tưởng được chia sẻ."}
            </p>
          </div>
        </div>
        <div
          role="status"
          className="flex shrink-0 items-center gap-2 text-[10px] text-muted"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${ready ? "bg-positive" : "bg-subtle"}`}
          />
          <span className="hidden sm:inline">{statuses[state.status]}</span>
        </div>
      </header>
      {!ready && (
        <div
          role="status"
          className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-surface-muted/60 px-4 py-3 text-xs text-muted"
        >
          <span>{state.error ?? `${statuses[state.status]}…`}</span>
          <button
            onClick={() => connection.retry()}
            aria-label="Kết nối lại"
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-surface"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Thử lại
          </button>
        </div>
      )}
      <MessageList
        messages={messages}
        userId={userId}
        userName={userName}
        loading={history.isLoading}
        hasOlder={!!history.hasNextPage}
        loadingOlder={history.isFetchingNextPage}
        error={history.isError}
        loadOlder={() => history.fetchNextPage()}
        retry={() => {
          void history.refetch();
        }}
      />

      <div role="status" className="min-h-6 shrink-0 px-3 sm:px-5">
        <TypingIndicator typingNames={ready ? currentTypers : []} />
      </div>
      <MessageComposer
        channelId={channel.id}
        ready={ready}
        onSend={(message) => connection.send(message)}
        onTyping={(channelId) => connection.sendTyping(channelId)}
        stopTyping={(channelId) => connection.stopTyping(channelId)}
      />
    </section>
  );
}

