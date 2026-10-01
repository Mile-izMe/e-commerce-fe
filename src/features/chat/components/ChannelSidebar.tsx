import { Check, Copy, Hash, Plus, RefreshCw, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Channel, Guild } from "../types";

interface Props {
  guild?: Guild;
  channels: Channel[];
  channelId?: string;
  isOwner: boolean;
  loading: boolean;
  error: boolean;
  userId: string;
  userName: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onAddMember: () => void;
  onRetry: () => void;
  onClose: () => void;
}

export function ChannelSidebar({
  guild,
  channels,
  channelId,
  isOwner,
  loading,
  error,
  userId,
  userName,
  onSelect,
  onCreate,
  onAddMember,
  onRetry,
  onClose,
}: Props) {
  const [copied, setCopied] = useState(false);
  async function copyId() {
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      toast.success("Đã sao chép ID tài khoản");
    } catch {
      toast.error("Không thể sao chép. Bạn có thể chọn ID bên dưới.");
    }
  }
  return (
    <aside className="flex h-full w-60 min-w-0 flex-col bg-surface">
      <div className="border-b border-line p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-medium tracking-[0.2em] text-subtle">
            KHÔNG GIAN CỦA BẠN
          </p>
          <button
            onClick={onClose}
            aria-label="Đóng danh sách channel"
            className="text-muted lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <h2 className="truncate text-lg font-semibold tracking-tight">
          {guild?.name ?? "Chọn một guild"}
        </h2>
        {guild?.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
            {guild.description}
          </p>
        )}
        {guild && (
          <span className="mt-3 inline-block rounded-full border border-line px-2.5 py-1 text-[10px] text-muted">
            {isOwner ? "Owner" : "Thành viên"}
          </span>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-3">
        <div className="flex items-center justify-between px-2 py-3">
          <h3 className="text-[10px] font-semibold tracking-[0.15em] text-subtle">
            CHANNELS <span className="ml-1 text-muted">{channels.length}</span>
          </h3>
          {isOwner && (
            <button
              onClick={onCreate}
              aria-label="Tạo channel"
              className="cursor-pointer rounded-lg p-1 text-muted hover:bg-surface-muted"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
        <nav
          aria-label="Channels"
          className="min-h-0 flex-1 space-y-1 overflow-y-auto"
        >
          {loading && (
            <p role="status" className="px-2 py-3 text-xs text-muted">
              Đang tải channels…
            </p>
          )}
          {error && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 p-2 text-xs text-danger"
            >
              <RefreshCw className="h-3 w-3" /> Thử tải lại
            </button>
          )}
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onSelect(channel.id)}
              aria-current={channel.id === channelId ? "page" : undefined}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition ${channel.id === channelId ? "bg-surface-muted font-medium text-foreground" : "text-muted hover:bg-surface-muted/60 hover:text-foreground"}`}
            >
              <Hash className="h-4 w-4 shrink-0 text-accent" />
              <span className="truncate">{channel.name}</span>
              {channel.id === channelId && (
                <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              )}
            </button>
          ))}
          {guild && !loading && !error && !channels.length && (
            <p className="px-2 py-3 text-xs leading-relaxed text-muted">
              Chưa có channel.{" "}
              {isOwner
                ? "Tạo một nơi để bắt đầu trò chuyện."
                : "Owner sẽ tạo channel cho không gian này."}
            </p>
          )}
        </nav>
        {isOwner && (
          <button
            onClick={onAddMember}
            className="mt-3 flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-xs text-muted hover:bg-surface-muted"
          >
            <UserPlus className="h-4 w-4" /> Thêm thành viên
          </button>
        )}
      </div>
      <div className="border-t border-line p-4">
        <p className="truncate text-xs font-semibold">{userName}</p>
        <div className="mt-2 flex items-center gap-2">
          <code
            title={userId}
            className="min-w-0 flex-1 select-all break-all text-[10px] leading-relaxed text-subtle"
          >
            {userId}
          </code>
          <button
            onClick={copyId}
            aria-label="Sao chép ID tài khoản"
            className="shrink-0 rounded-lg p-2 text-muted hover:bg-surface-muted"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
