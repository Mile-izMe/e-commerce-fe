"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useAuthStore } from "@/store";
import { AuthModal } from "@/src/features/auth";
import type { AuthMode } from "@/src/features/auth/components/AuthModal";
import { refreshSession } from "@/src/shared/lib/auth-session";
import { ChatWorkspace } from "./ChatWorkspace";

export function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const version = useAuthStore((state) => state.sessionVersion);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [recovering, setRecovering] = useState(false);
  if (user && status === "authenticated")
    return (
      <ChatWorkspace
        key={`${user.id}:${version}`}
        user={user}
        sessionVersion={version}
      />
    );

  async function restore() {
    setRecovering(true);
    try {
      await refreshSession();
    } catch {
      if (useAuthStore.getState().status !== "unauthenticated")
        useAuthStore.getState().setRestoreFailed();
    } finally {
      setRecovering(false);
    }
  }
  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <MessageCircle className="mb-6 h-10 w-10 text-accent" strokeWidth={1} />
      <p className="mb-4 text-[10px] tracking-[0.25em] text-subtle">
        ATELIER SPACES
      </p>
      <h1 className="text-3xl font-medium tracking-tight">
        Cuộc trò chuyện có chỗ của riêng mình.
      </h1>
      <p
        role="status"
        className="mt-4 max-w-md text-sm leading-relaxed text-muted"
      >
        {status === "restoring"
          ? "Đang khôi phục phiên đăng nhập…"
          : status === "restoreFailed"
            ? "Chưa thể khôi phục phiên. Hãy thử kết nối lại."
            : "Đăng nhập để mở guild, chọn channel và bắt đầu trò chuyện."}
      </p>
      {status === "restoreFailed" ? (
        <button
          onClick={() => {
            void restore();
          }}
          disabled={recovering}
          className="mt-7 rounded-full bg-action px-6 py-3 text-sm text-action-foreground disabled:opacity-40"
        >
          {recovering ? "Đang khôi phục…" : "Thử kết nối lại"}
        </button>
      ) : (
        status !== "restoring" && (
          <button
            onClick={() => setOpen(true)}
            className="mt-7 rounded-full bg-action px-6 py-3 text-sm text-action-foreground"
          >
            Đăng nhập để trò chuyện
          </button>
        )
      )}
      <AuthModal
        isOpen={open}
        mode={mode}
        onModeChange={setMode}
        onClose={() => setOpen(false)}
      />
    </main>
  );
}
