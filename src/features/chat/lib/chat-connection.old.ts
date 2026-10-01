import { join } from "path";
import {
  ChatFailure,
  ChatMessage,
  ConnectionState,
  OutgoingMessage,
} from "../types";

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
  onRoomReady: (channelId: string) => void;
}

export class ChatConnection {
  private desired: string | null = null; // channel mong muốn
  private joined: string | null = null; // channel đã join
  private rooms: Promise<void> = Promise.resolve();

  constructor(private readonly options: Options) {}

  start() {
    const { socket } = this.options;
    socket.on("connect", () => {
      console.log("Client connected to Websocket Successfully");
      this.joined = null;
      this.queueRooms();
    });
    socket.on("disconnect", () => {
      console.log("Client disconnected");
      this.joined = null;
    });
    socket.on("message.created", (message: ChatMessage) => {
      console.log("Someone is chatting in room");
      if (
        this.joined === message.channelId &&
        this.desired === message.channelId
      ) {
        this.options.onMessage(message);
      }
    });
  }

  selectChannel(channelId: string) {
    this.desired = channelId;
    this.queueRooms();
  }

  send(payload: OutgoingMessage): Promise<unknown> {
    const { socket } = this.options;
    if (
      this.joined !== payload.channelId ||
      this.desired !== payload.channelId
    ) {
      throw new Error();
    }
    const message = socket.timeout(1000).emitWithAck("message.send", payload);
    return message;
  }

  private async queueRooms() {
    const { socket } = this.options;
    this.rooms = this.rooms
      .catch(() => {})
      .then(async () => {
        const target = this.desired;
        if (this.joined && this.joined !== target) {
          await socket
            .timeout(1000)
            .emitWithAck("channel.leave", { channelId: this.joined });
        }
        this.joined = null;
        if (target && this.joined !== target) {
          await socket
            .timeout(1000)
            .emitWithAck("channel.join", { channelId: target });
        }
        this.joined = target;
        if (target !== this.desired) return;
        if (target) this.options.onRoomReady(target);
      });
  }
}
