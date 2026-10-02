import type {
  ChatAck,
  ChatFailure,
  ChatMessage,
  ConnectionState,
  OutgoingMessage,
  TypingEvent
} from "../types";

// A small transport interface makes connection/auth/room races testable without React.
export interface ChatTransport {
  connected: boolean;
  auth: object;
  on(event: string, listener: (...args: never[]) => void): unknown;
  removeAllListeners(): unknown;
  connect(): unknown;
  disconnect(): unknown;
  timeout(ms: number): {
    emitWithAck(event: string, payload: unknown): Promise<unknown>;
  };
}

interface Options {
  socket: ChatTransport;
  getToken: () => string | null;
  isCurrentSession: () => boolean;
  refresh: () => Promise<unknown>;
  onState: (state: ConnectionState) => void;
  onMessage: (message: ChatMessage) => void;
  onTyping: (payload: TypingEvent) => void;
  onRoomReady: (channelId: string) => void;
}

export class ChatEventError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function describeFailure(error: ChatFailure): string {
  const messages: Record<string, string> = {
    AUTH_INVALID: "Phiên đăng nhập không hợp lệ. Vui lòng kết nối lại.",
    AUTH_EXPIRED: "Phiên kết nối đã hết hạn.",
    FORBIDDEN: "Bạn không có quyền truy cập channel này.",
    NOT_FOUND: "Channel không còn tồn tại.",
    RATE_LIMITED: "Bạn gửi quá nhanh. Hãy thử lại sau vài giây.",
    CONFLICT: "Mã tin nhắn đã được dùng cho nội dung khác.",
    INTERNAL_ERROR: "Máy chủ chưa thể xử lý. Vui lòng thử lại.",
  };
  return (
    messages[error.code] ??
    (Array.isArray(error.message) ? error.message.join(" · ") : error.message)
  );
}

const isAuthFailure = (code: string) =>
  code === "AUTH_INVALID" || code === "AUTH_EXPIRED";

export class ChatConnection {
  private desired: string | null = null;
  private joined: string | null = null;
  private epoch = 0;
  private disposed = false;
  private refreshTried = false;
  private recovering: Promise<void> | null = null;
  private rooms: Promise<void> = Promise.resolve();

  constructor(private readonly options: Options) {}

  start() {
    // React Strict Mode replays effects: the same idle transport can start again.
    this.disposed = false;
    const { socket } = this.options;
    socket.on("connect", () => {
      if (!this.active()) return;
      this.epoch++;
      this.joined = null;
      this.refreshTried = false;
      this.report("joining");
      this.queueRooms();
    });
    socket.on("disconnect", (reason: string) => {
      if (!this.active()) return;
      this.epoch++;
      this.joined = null;
      this.report(
        this.recovering || reason !== "io server disconnect"
          ? "reconnecting"
          : "offline",
      );
    });
    socket.on("connect_error", (error: Error & { data?: ChatFailure }) => {
      if (!this.active()) return;
      if (error.data && isAuthFailure(error.data.code)) void this.recover();
      else
        this.report(
          "error",
          error.data
            ? describeFailure(error.data)
            : "Không thể kết nối tới máy chủ chat.",
        );
    });
    socket.on("chat.error", (response: { error: ChatFailure }) => {
      if (!this.active()) return;
      if (isAuthFailure(response.error.code)) void this.recover();
      else this.report("error", describeFailure(response.error));
    });
    socket.on("message.created", (message: ChatMessage) => {
      if (
        this.active() &&
        message.channelId === this.desired &&
        message.channelId === this.joined
      )
        this.options.onMessage(message);
    });
    socket.on("typing.changed", (payload: TypingEvent) => {
      if (
        this.active() &&
        payload.channelId === this.desired &&
        payload.channelId === this.joined
      )
        this.options.onTyping(payload);
    });
    this.retry();
  }

  selectChannel(channelId: string | null) {
    this.desired = channelId;
    if (this.options.socket.connected) {
      this.report("joining");
      this.queueRooms();
    }
  }

  retry() {
    if (!this.active()) return;
    this.refreshTried = false;
    this.options.socket.auth = { token: this.options.getToken() };
    this.options.socket.disconnect();
    this.report("connecting");
    this.options.socket.connect();
  }

  close() {
    this.disposed = true;
    this.epoch++;
    this.options.socket.removeAllListeners();
    this.options.socket.disconnect();
  }

  async send(payload: OutgoingMessage): Promise<ChatMessage> {
    if (
      !this.active() ||
      !this.options.socket.connected ||
      this.joined !== payload.channelId ||
      this.desired !== payload.channelId
    ) {
      throw new ChatEventError(
        "OFFLINE",
        "Hãy chờ channel kết nối rồi gửi lại.",
      );
    }
    const message = await this.request<ChatMessage>("message.send", payload);
    if (!this.active())
      throw new ChatEventError(
        "SESSION_CHANGED",  
        "Phiên đăng nhập đã thay đổi.",
      );
    this.options.onMessage(message);
    return message;
  }

  async sendTyping(channelId: string): Promise<void> {
    // Typing là trạng thái tạm: bỏ qua nếu chưa join đúng phòng hoặc đã offline.
    // Không đưa activity cũ vào hàng đợi để gửi lại sau reconnect.
    if (
      !this.active() ||
      !this.options.socket.connected ||
      this.joined !== channelId ||
      this.desired !== channelId
    ) return;
    await this.request("typing.activity", { channelId });
  }

  async stopTyping(channelId: string): Promise<void> {
    // Cleanup phòng cũ vẫn được báo stop nếu socket còn ở phòng đó.
    // Khi đã disconnect/rời phòng, bỏ qua; TTL bên người nhận sẽ dọn entry.
    if (
      !this.active() ||
      !this.options.socket.connected ||
      this.joined !== channelId
    ) return;
    await this.request("typing.stop", { channelId });
  }
  private active() {
    return !this.disposed && this.options.isCurrentSession();
  }
  private report(
    status: ConnectionState["status"],
    error: string | null = null,
  ) {
    if (this.active())
      this.options.onState({
        status,
        channelId: status === "ready" ? this.joined : null,
        error,
      });
  }

  private async request<T>(event: string, payload: unknown): Promise<T> {
    let response: ChatAck<T>;
    try {
      response = (await this.options.socket
        .timeout(5000)
        .emitWithAck(event, payload)) as ChatAck<T>;
    } catch {
      throw new ChatEventError(
        "ACK_TIMEOUT",
        "Chưa nhận được xác nhận. Có thể tin đã được lưu; thử lại sẽ dùng cùng mã tin nhắn.",
      );
    }
    if (!response.success) {
      if (isAuthFailure(response.error.code)) void this.recover();
      throw new ChatEventError(
        response.error.code,
        describeFailure(response.error),
      );
    }
    return response.data;
  }

  private queueRooms() {
    this.rooms = this.rooms
      .catch(() => {})
      .then(async () => {
        if (!this.active() || !this.options.socket.connected) return;
        const epoch = this.epoch;
        const target = this.desired;
        if (this.joined && this.joined !== target) {
          await this.request("channel.leave", { channelId: this.joined });
          if (!this.active() || epoch !== this.epoch) return;
          this.joined = null;
        }
        if (target && this.joined !== target) {
          await this.request("channel.join", { channelId: target });
          if (!this.active() || epoch !== this.epoch) return;
          this.joined = target;
        }
        if (target !== this.desired || !this.active()) return;
        this.report("ready");
        if (target) this.options.onRoomReady(target);
      })
      .catch((error: unknown) => {
        if (this.active() && this.options.socket.connected && !this.recovering)
          this.report(
            "error",
            error instanceof Error ? error.message : "Không thể vào channel.",
          );
      });
  }

  private recover(): Promise<void> {
    if (this.recovering) return this.recovering;
    if (!this.active()) return Promise.resolve();
    if (this.refreshTried) {
      this.options.socket.disconnect();
      this.report(
        "error",
        "Không thể xác thực kết nối. Vui lòng thử kết nối lại.",
      );
      return Promise.resolve();
    }
    this.refreshTried = true;
    this.report("reconnecting");
    this.recovering = (async () => {
      try {
        await this.options.refresh();
        if (!this.active()) return;
        this.options.socket.auth = { token: this.options.getToken() };
        this.options.socket.disconnect();
        this.options.socket.connect();
      } catch (error) {
        if (this.active())
          this.report(
            "error",
            error instanceof Error
              ? error.message
              : "Không thể khôi phục kết nối.",
          );
      } finally {
        this.recovering = null;
      }
    })();
    return this.recovering;
  }
}
