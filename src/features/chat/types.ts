export interface Guild {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface Channel {
  id: string;
  guildId: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  authorId: string;
  clientMessageId: string;
  content: string;
  createdAt: string;
}

export interface OutgoingMessage {
  channelId: string;
  clientMessageId: string;
  content: string;
}

export interface ChatFailure {
  code: string;
  message: string | string[];
}

export type ChatAck<T> =
  | { success: true; data: T }
  | { success: false; error: ChatFailure };
export type ConnectionStatus =
  | "connecting"
  | "reconnecting"
  | "joining"
  | "ready"
  | "offline"
  | "error";
export interface ConnectionState {
  status: ConnectionStatus;
  channelId: string | null;
  error: string | null;
}

export type TypingState = Record<
  string,
  {
    channelId: string | null;
    userName: string;
    isTyping: boolean;
  }
>;

export interface TypingEvent {
  userId: string;
  userName: string;
  channelId: string;
  isTyping: boolean;
}
