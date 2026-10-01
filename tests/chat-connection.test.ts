import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChatConnection,
  type ChatTransport,
} from "../src/features/chat/lib/chat-connection";
import { mergeMessages } from "../src/features/chat/lib/messages";
import type { ChatMessage, ConnectionState } from "../src/features/chat/types";

const tick = () => new Promise<void>((resolve) => setImmediate(resolve));
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

class FakeSocket implements ChatTransport {
  connected = false;
  auth: object = {};
  connects = 0;
  calls: { event: string; payload: unknown }[] = [];
  listeners = new Map<string, (...args: never[]) => void>();
  reply: (event: string, payload: unknown) => Promise<unknown> = async (
    _event,
    payload,
  ) => ({ success: true, data: payload });
  on(event: string, listener: (...args: never[]) => void) {
    this.listeners.set(event, listener);
  }
  removeAllListeners() {
    this.listeners.clear();
  }
  connect() {
    this.connects++;
  }
  disconnect() {
    if (this.connected) {
      this.connected = false;
      this.fire("disconnect", "io client disconnect");
    }
  }
  fire(event: string, ...args: unknown[]) {
    (this.listeners.get(event) as ((...args: unknown[]) => void) | undefined)?.(
      ...args,
    );
  }
  established() {
    this.connected = true;
    this.fire("connect");
  }
  timeout() {
    return {
      emitWithAck: async (event: string, payload: unknown) => {
        this.calls.push({ event, payload });
        return this.reply(event, payload);
      },
    };
  }
}

function fixture() {
  const socket = new FakeSocket();
  const states: ConnectionState[] = [];
  const received: ChatMessage[] = [];
  const joined: string[] = [];
  let current = true;
  let token = "old-token";
  let refreshes = 0;
  let refresh: () => Promise<unknown> = async () => {
    token = "new-token";
  };
  const connection = new ChatConnection({
    socket,
    getToken: () => token,
    isCurrentSession: () => current,
    refresh: async () => {
      refreshes++;
      return refresh();
    },
    onState: (state) => states.push(state),
    onMessage: (message) => received.push(message),
    onRoomReady: (id) => joined.push(id),
  });
  return {
    socket,
    states,
    received,
    joined,
    connection,
    setCurrent: (value: boolean) => {
      current = value;
    },
    setRefresh: (fn: () => Promise<unknown>) => {
      refresh = fn;
    },
    refreshes: () => refreshes,
  };
}

const message = (id: string, channelId = "a"): ChatMessage => ({
  id,
  channelId,
  authorId: "author",
  clientMessageId: `client-${id}`,
  content: id,
  createdAt: "2026-10-01T09:00:00.000Z",
});

test("joins the selected room and leaves it before joining another", async () => {
  const f = fixture();
  f.connection.start();
  f.connection.selectChannel("a");
  f.socket.established();
  await tick();
  assert.deepEqual(f.joined, ["a"]);
  f.connection.selectChannel("b");
  await tick();
  assert.deepEqual(
    f.socket.calls.map((call) => call.event),
    ["channel.join", "channel.leave", "channel.join"],
  );
  assert.equal(f.states.at(-1)?.channelId, "b");
});

test("serializes rapid room switches and never marks the stale room ready", async () => {
  const f = fixture();
  const join = deferred<unknown>();
  f.socket.reply = async (_event, payload) =>
    (payload as { channelId: string }).channelId === "a" &&
    _event === "channel.join"
      ? join.promise
      : { success: true, data: payload };
  f.connection.start();
  f.connection.selectChannel("a");
  f.socket.established();
  await tick();
  f.connection.selectChannel("b");
  join.resolve({ success: true, data: { channelId: "a" } });
  await tick();
  assert.deepEqual(f.joined, ["b"]);
  assert.equal(f.states.at(-1)?.channelId, "b");
  assert.ok(
    f.socket.calls.some(
      (call) =>
        call.event === "channel.leave" &&
        (call.payload as { channelId: string }).channelId === "a",
    ),
  );
});

test("rejoins after reconnect and requests history recovery", async () => {
  const f = fixture();
  f.connection.start();
  f.connection.selectChannel("a");
  f.socket.established();
  await tick();
  f.socket.connected = false;
  f.socket.fire("disconnect", "transport close");
  f.socket.established();
  await tick();
  assert.deepEqual(f.joined, ["a", "a"]);
});

test("ignores messages from a different room and from a stale session", async () => {
  const f = fixture();
  f.connection.start();
  f.connection.selectChannel("a");
  f.socket.established();
  await tick();
  f.socket.fire("message.created", message("wrong", "b"));
  f.socket.fire("message.created", message("right"));
  f.setCurrent(false);
  f.socket.fire("message.created", message("stale"));
  assert.deepEqual(
    f.received.map((value) => value.id),
    ["right"],
  );
});

test("coalesces simultaneous auth failures and reconnects with the rotated token", async () => {
  const f = fixture();
  const refresh = deferred<void>();
  f.setRefresh(() => refresh.promise);
  f.connection.start();
  f.socket.fire("connect_error", {
    data: { code: "AUTH_EXPIRED", message: "Expired" },
  });
  f.socket.fire("chat.error", {
    error: { code: "AUTH_EXPIRED", message: "Expired" },
  });
  assert.equal(f.refreshes(), 1);
  refresh.resolve();
  await tick();
  assert.equal(f.socket.connects, 2);
});

test("does not loop refresh when the replacement token is rejected", async () => {
  const f = fixture();
  f.connection.start();
  f.socket.fire("connect_error", {
    data: { code: "AUTH_INVALID", message: "Invalid" },
  });
  await tick();
  assert.deepEqual(f.socket.auth, { token: "new-token" });
  f.socket.fire("connect_error", {
    data: { code: "AUTH_INVALID", message: "Invalid" },
  });
  await tick();
  assert.equal(f.refreshes(), 1);
  assert.equal(f.states.at(-1)?.status, "error");
});

test("close or account switch during refresh cannot reconnect the old socket", async () => {
  for (const action of ["close", "switch"]) {
    const f = fixture();
    const refresh = deferred<void>();
    f.setRefresh(() => refresh.promise);
    f.connection.start();
    f.socket.fire("connect_error", {
      data: { code: "AUTH_INVALID", message: "Invalid" },
    });
    if (action === "close") f.connection.close();
    else f.setCurrent(false);
    refresh.resolve();
    await tick();
    assert.equal(f.socket.connects, 1);
  }
});

test("permissions errors do not refresh credentials", async () => {
  const f = fixture();
  f.connection.start();
  f.socket.fire("connect_error", {
    data: { code: "FORBIDDEN", message: "Forbidden" },
  });
  await tick();
  assert.equal(f.refreshes(), 0);
  assert.equal(f.states.at(-1)?.status, "error");
});

test("does not send until the correct room is ready", async () => {
  const f = fixture();
  f.connection.start();
  await assert.rejects(
    f.connection.send({
      channelId: "a",
      clientMessageId: "same-key",
      content: "Hello",
    }),
    /chờ channel/,
  );
  assert.equal(f.socket.calls.length, 0);
});

test("ack timeout preserves caller key for a safe retry", async () => {
  const f = fixture();
  f.connection.start();
  f.connection.selectChannel("a");
  f.socket.established();
  await tick();
  const outgoing = {
    channelId: "a",
    clientMessageId: "same-key",
    content: "Hello",
  };
  f.socket.reply = async () => {
    throw new Error("Timeout");
  };
  await assert.rejects(f.connection.send(outgoing), /cùng mã tin nhắn/);
  f.socket.reply = async () => ({ success: true, data: message("saved") });
  await f.connection.send(outgoing);
  assert.deepEqual(
    f.socket.calls
      .filter((call) => call.event === "message.send")
      .map((call) => call.payload),
    [outgoing, outgoing],
  );
  assert.equal(f.received.length, 1);
});

test("handles React Strict Mode effect replay without a permanently closed connection", async () => {
  const f = fixture();
  f.connection.start();
  f.connection.close();
  f.connection.start();
  f.connection.selectChannel("a");
  f.socket.established();
  await tick();
  assert.equal(f.states.at(-1)?.channelId, "a");
});

test("merges ack, broadcast and history exactly once in stable chronological order", () => {
  const earlier = { ...message("a"), createdAt: "2026-10-01T08:00:00.000Z" };
  assert.deepEqual(
    mergeMessages([message("b"), earlier], [message("b"), message("c")]).map(
      (value) => value.id,
    ),
    ["a", "b", "c"],
  );
});
