import { useEffect, useRef, useState } from "react";
import { ArrowDown, MessageCircle } from "lucide-react";
import { initials, shortId } from "../lib/messages";
import type { ChatMessage } from "../types";

const time = (value: string) =>
  new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
const day = (value: string) =>
  new Date(value).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

interface Props {
  messages: ChatMessage[];
  userId: string;
  userName: string;
  loading: boolean;
  hasOlder: boolean;
  loadingOlder: boolean;
  error: boolean;
  loadOlder: () => Promise<unknown>;
  retry: () => void;
}

export function MessageList({
  messages,
  userId,
  userName,
  loading,
  hasOlder,
  loadingOlder,
  error,
  loadOlder,
  retry,
}: Props) {
  const scroll = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const [showJump, setShowJump] = useState(false);
  const lastId = messages.at(-1)?.id;
  const ownLast = messages.at(-1)?.authorId === userId;
  useEffect(() => {
    if (nearBottom.current || ownLast)
      bottom.current?.scrollIntoView({ block: "end" });
  }, [lastId, ownLast]);
  async function older() {
    const element = scroll.current;
    if (!element) return;
    const height = element.scrollHeight;
    const position = element.scrollTop;
    await loadOlder();
    requestAnimationFrame(() => {
      element.scrollTop = position + element.scrollHeight - height;
    });
  }
  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scroll}
        onScroll={() => {
          const element = scroll.current;
          if (!element) return;
          nearBottom.current =
            element.scrollHeight - element.scrollTop - element.clientHeight <
            100;
          setShowJump(!nearBottom.current);
        }}
        className="h-full overflow-y-auto overscroll-contain px-4 py-6 sm:px-7"
      >
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-danger/30 p-3 text-xs text-danger"
          >
            Không tải được lịch sử.{" "}
            <button onClick={retry} className="underline">
              Thử lại
            </button>
          </div>
        )}
        {hasOlder && (
          <div className="mb-7 text-center">
            <button
              onClick={() => {
                void older();
              }}
              disabled={loadingOlder}
              className="rounded-full border border-line bg-surface px-4 py-2 text-xs text-muted hover:text-foreground disabled:opacity-40"
            >
              {loadingOlder ? "Đang tải…" : "Xem tin nhắn cũ hơn"}
            </button>
          </div>
        )}
        {loading && (
          <p role="status" className="py-8 text-center text-xs text-muted">
            Đang tải cuộc trò chuyện…
          </p>
        )}
        {!loading && !error && !messages.length && (
          <div className="flex min-h-60 flex-col items-center justify-center text-center">
            <MessageCircle
              className="mb-5 h-8 w-8 text-accent"
              strokeWidth={1}
            />
            <h3 className="text-lg font-medium tracking-tight">
              Cuộc trò chuyện bắt đầu từ đây.
            </h3>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted">
              Một ý tưởng, một câu hỏi, hoặc đơn giản là lời chào.
            </p>
          </div>
        )}
        <ol aria-label="Tin nhắn" className="space-y-5">
          {messages.map((message, index) => {
            const own = message.authorId === userId;
            const name = own
              ? userName
              : `Thành viên ${shortId(message.authorId)}`;
            const newDay =
              index === 0 ||
              day(messages[index - 1].createdAt) !== day(message.createdAt);
            return (
              <li key={message.id}>
                {newDay && (
                  <div className="mb-7 mt-3 flex items-center gap-3 text-[10px] text-subtle">
                    <span className="h-px flex-1 bg-line" />
                    <span>{day(message.createdAt)}</span>
                    <span className="h-px flex-1 bg-line" />
                  </div>
                )}
                <article
                  className={`flex items-start gap-3 ${own ? "flex-row-reverse" : ""}`}
                >
                  <div
                    title={message.authorId}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[10px] font-semibold ${own ? "bg-action text-action-foreground" : "border border-line bg-surface-muted text-accent"}`}
                  >
                    {initials(name)}
                  </div>
                  <div className="min-w-0 max-w-[85%] sm:max-w-[75%]">
                    <div
                      className={`mb-1.5 flex items-center gap-2 ${own ? "justify-end" : ""}`}
                    >
                      <span className="text-[11px] font-medium text-muted">
                        {own ? "Bạn" : name}
                      </span>
                      <time
                        dateTime={message.createdAt}
                        className="text-[10px] text-subtle"
                      >
                        {time(message.createdAt)}
                      </time>
                    </div>
                    <p
                      className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed [overflow-wrap:anywhere] ${own ? "rounded-tr-md bg-action text-action-foreground" : "rounded-tl-md border border-line bg-surface"}`}
                    >
                      {message.content}
                    </p>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
        <div ref={bottom} className="h-1" />
      </div>
      {showJump && (
        <button
          onClick={() =>
            bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" })
          }
          aria-label="Xuống tin nhắn mới nhất"
          className="absolute bottom-4 right-4 rounded-full border border-line bg-surface p-2.5 text-muted shadow-lg"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
