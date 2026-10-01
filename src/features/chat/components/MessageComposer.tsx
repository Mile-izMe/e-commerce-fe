import { useRef, useState } from "react";
import { ArrowUp, LoaderCircle } from "lucide-react";
import type { OutgoingMessage } from "../types";

export function MessageComposer({
  channelId,
  ready,
  onSend,
}: {
  channelId: string;
  ready: boolean;
  onSend: (message: OutgoingMessage) => Promise<unknown>;
}) {
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const outgoing = useRef<OutgoingMessage | null>(null);
  const busy = useRef(false);
  async function submit(event?: React.FormEvent) {
    event?.preventDefault();
    if (!ready || busy.current || !content.trim()) return;
    busy.current = true;
    setPending(true);
    setError(null);
    if (!outgoing.current || outgoing.current.content !== content.trim())
      outgoing.current = {
        channelId,
        clientMessageId: crypto.randomUUID(),
        content: content.trim(),
      };
    try {
      await onSend(outgoing.current);
      setContent("");
      outgoing.current = null;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Chưa gửi được tin nhắn.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      className="shrink-0 border-t border-line bg-surface p-3 sm:p-5"
    >
      {error && (
        <p role="alert" className="mb-3 text-xs leading-relaxed text-danger">
          {error} Nội dung được giữ lại để bạn gửi lại.
        </p>
      )}
      <div className="flex items-end gap-3 rounded-2xl border border-line bg-background p-3 focus-within:border-accent">
        <textarea
          aria-label="Nội dung tin nhắn"
          placeholder={
            ready ? "Viết một tin nhắn…" : "Đang chờ kết nối channel…"
          }
          value={content}
          maxLength={2000}
          rows={2}
          disabled={pending}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              void submit();
            }
          }}
          className="max-h-36 min-h-12 min-w-0 flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-subtle"
        />
        <button
          type="submit"
          disabled={!ready || pending || !content.trim()}
          aria-label={error ? "Gửi lại tin nhắn" : "Gửi tin nhắn"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-action text-action-foreground transition hover:bg-action-hover disabled:opacity-30"
        >
          {pending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-5 w-5" />
          )}
        </button>
      </div>
      <div className="mt-2 flex justify-between gap-3 text-[10px] text-subtle">
        <span>Enter để gửi · Shift + Enter để xuống dòng</span>
        <span>{content.length}/2000</span>
      </div>
    </form>
  );
}
