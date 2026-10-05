import { ArrowUp, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { OutgoingMessage } from "../types";

const TYPING_THROTTLE_MS = 2000;
const TYPING_IDLE_MS = 3000;

function reportTypingError(error: unknown) {
  // [6] Lỗi activity/stop chỉ được ghi log, không gọi setError của luồng gửi tin.
  console.warn("Không thể cập nhật trạng thái nhập.", error);
}

export function MessageComposer({
  channelId,
  ready,
  onSend,
  onTyping,
  stopTyping,
}: {
  channelId: string;
  ready: boolean;
  onSend: (message: OutgoingMessage) => Promise<unknown>;
  onTyping: (channelId: string) => Promise<unknown>;
  stopTyping: (channelId: string) => Promise<unknown>;
}) {
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // [1] Payload tin nhắn được giữ riêng cho retry; các hàm typing không sửa ref này.
  const outgoing = useRef<OutgoingMessage | null>(null);
  const busy = useRef(false);

  // [1] Typing có timer, mốc throttle và cờ hoạt động riêng; chỉ gửi channelId.
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmittedAt = useRef(0);
  const typingActive = useRef(false);
  const stopTypingRef = useRef(stopTyping);

  // Giữ callback stop mới nhất mà không reset timer mỗi lần parent render.
  useEffect(() => {
    stopTypingRef.current = stopTyping;
  }, [stopTyping]);

  // [5] Cleanup chạy khi channelId/ready đổi hoặc component unmount.
  // Hủy timer local và thử báo stop cho channel cũ; mạng mất thì stop có thể thất bại.
  useEffect(() => {
    return () => {
      if (typingTimeout.current !== null) clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
      lastEmittedAt.current = 0;
      if (typingActive.current) {
        typingActive.current = false;
        void stopTypingRef.current(channelId).catch(reportTypingError);
      }
    };
  }, [channelId, ready]);

  // Dùng chung khi hết 3 giây, xóa hết nội dung hoặc bấm gửi: hủy timer và báo stop.
  function endTyping() {
    if (typingTimeout.current !== null) clearTimeout(typingTimeout.current);
    typingTimeout.current = null;
    lastEmittedAt.current = 0;
    if (!typingActive.current) return;
    typingActive.current = false;
    void stopTyping(channelId).catch(reportTypingError);
  }

  function handleTyping(value: string) {
    // [4] Kiểm tra giá trị mới từ ô nhập; rỗng/toàn khoảng trắng thì stop ngay.
    if (!ready || !value.trim()) {
      endTyping();
      return;
    }

    // [3] Debounce: mỗi lần nhập đều hủy timer cũ và đếm lại 3 giây, không chờ ACK.
    if (typingTimeout.current !== null) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(endTyping, TYPING_IDLE_MS);

    // [2] Throttle: báo ngay đầu một đợt nhập, rồi tối đa một lần mỗi 2 giây.
    const now = Date.now();
    if (
      !typingActive.current ||
      now - lastEmittedAt.current >= TYPING_THROTTLE_MS
    ) {
      typingActive.current = true;
      // Ghi mốc trước khi gửi để các lần gõ tiếp không chờ ACK rồi emit trùng.
      lastEmittedAt.current = now;
      void onTyping(channelId).catch(reportTypingError);
    }
  }

  async function submit(event?: React.FormEvent) {
    event?.preventDefault();
    if (!ready || busy.current || !content.trim()) return;
    busy.current = true;
    setPending(true);
    setError(null);
    // [6] Bấm gửi kết thúc typing ngay; không await stop nên gửi tin không phụ thuộc ACK stop.
    endTyping();

    // [1] Retry cùng nội dung dùng lại clientMessageId; chỉ tạo payload mới khi nội dung đổi.
    if (!outgoing.current || outgoing.current.content !== content.trim()) {
      outgoing.current = {
        channelId,
        clientMessageId: crypto.randomUUID(),
        content: content.trim(),
      };
    }
    // [6] try/catch này chỉ xử lý gửi tin; lỗi typing được catch riêng ở reportTypingError.
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
          maxLength={5000}
          rows={5}
          disabled={pending}
          onChange={(event) => {
            // [4] Dùng value của event, không đọc content cũ ngay sau setContent.
            const value = event.target.value;
            setContent(value);
            handleTyping(value);
          }}
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
        <span>{content.length}/5000</span>
      </div>
    </form>
  );
}
