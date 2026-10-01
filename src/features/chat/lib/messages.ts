import type { ChatMessage } from "../types";

// Ack, history and broadcast may all contain the same message.
export function mergeMessages(
  ...lists: readonly ChatMessage[][]
): ChatMessage[] {
  const unique = new Map<string, ChatMessage>();
  for (const list of lists)
    for (const message of list) unique.set(message.id, message);
  return [...unique.values()].sort(
    (a, b) =>
      a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
}

export function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "A"
  );
}

export function shortId(id: string) {
  return id.slice(0, 8);
}
