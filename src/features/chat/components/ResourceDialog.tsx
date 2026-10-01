import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export type ResourceAction = "guild" | "channel" | "member";
const labels = {
  guild: {
    title: "Một không gian mới",
    description: "Tạo guild để nhóm những cuộc trò chuyện cùng chủ đề.",
    label: "Tên guild",
    placeholder: "Ví dụ: Design collective",
    button: "Tạo guild",
  },
  channel: {
    title: "Thêm một channel",
    description: "Mỗi channel là một cuộc trò chuyện riêng trong guild.",
    label: "Tên channel",
    placeholder: "Ví dụ: general",
    button: "Tạo channel",
  },
  member: {
    title: "Mời thêm một người",
    description:
      "Dán ID tài khoản đã tồn tại. Người đó sẽ thấy guild sau khi tải lại danh sách.",
    label: "ID tài khoản",
    placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    button: "Thêm thành viên",
  },
};

export function ResourceDialog({
  action,
  onClose,
  onSubmit,
}: {
  action: ResourceAction;
  onClose: () => void;
  onSubmit: (value: string) => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const text = labels[action];
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current || !value.trim()) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      await onSubmit(value.trim());
      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Không thể hoàn tất thao tác.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
      aria-labelledby="chat-dialog-title"
      className="fixed inset-0 m-auto w-[calc(100%-32px)] max-w-md rounded-3xl border border-line bg-surface p-7 text-foreground shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-3 text-[10px] tracking-[0.2em] text-subtle">
            ATELIER SPACES
          </p>
          <h2
            id="chat-dialog-title"
            className="text-xl font-semibold tracking-tight"
          >
            {text.title}
          </h2>
        </div>
        <button
          onClick={onClose}
          disabled={pending}
          aria-label="Đóng"
          className="rounded-full p-2 text-muted hover:bg-surface-muted disabled:opacity-40"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mb-6 text-sm leading-relaxed text-muted">
        {text.description}
      </p>
      <form onSubmit={submit}>
        <label htmlFor="chat-resource-name" className="text-xs font-medium">
          {text.label}
        </label>
        <input
          id="chat-resource-name"
          autoFocus
          required
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={action === "member" ? 36 : 80}
          pattern={
            action === "member"
              ? "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
              : undefined
          }
          placeholder={text.placeholder}
          className="mt-2 w-full rounded-xl border border-line bg-background px-3 py-3 text-sm outline-none focus:border-accent"
        />
        {error && (
          <p role="alert" className="mt-3 text-xs text-danger">
            {error}
          </p>
        )}
        <button
          disabled={pending || !value.trim()}
          className="mt-6 w-full rounded-xl bg-action px-4 py-3 text-sm font-medium text-action-foreground hover:bg-action-hover disabled:opacity-40"
        >
          {pending ? "Đang xử lý…" : text.button}
        </button>
      </form>
    </dialog>
  );
}
