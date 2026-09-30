import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";
import { api, ApiClientError, requestData } from "../src/shared/lib/api";
import {
  logoutSession,
  refreshSession,
  sessionHttp,
} from "../src/shared/lib/auth-session";
import { useAuthStore } from "../store/useAuthStore";
import type { AuthResponse } from "../src/features/auth/types";

function session(
  accessToken = "old-access",
  refreshToken = "old-refresh",
  id = "user-a",
): AuthResponse {
  return {
    accessToken,
    refreshToken,
    tokenType: "Bearer",
    expiresIn: 900,
    user: {
      id,
      email: `${id}@example.test`,
      name: id,
      role: "CUSTOMER",
      status: "ACTIVE",
    },
  };
}
function response(
  config: InternalAxiosRequestConfig,
  data: unknown,
  status = 200,
) {
  return {
    config,
    data,
    status,
    statusText: String(status),
    headers: new AxiosHeaders(),
  };
}
function fail(config: InternalAxiosRequestConfig, status: number): never {
  throw new AxiosError(
    "Request failed",
    "ERR_BAD_RESPONSE",
    config,
    undefined,
    response(
      config,
      { success: false, message: "Denied", statusCode: status },
      status,
    ),
  );
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
let refreshes = 0;
beforeEach(() => {
  refreshes = 0;
  useAuthStore.getState().setAuth(session());
  sessionHttp.defaults.adapter = async (config) => {
    if (config.url === "/auth/logout") return response(config, undefined, 204);
    refreshes++;
    return response(config, {
      success: true,
      data: session("new-access", "new-refresh"),
    });
  };
  api.defaults.adapter = async (config) => {
    if (config.headers.get("Authorization") === "Bearer old-access")
      fail(config, 401);
    return response(config, { success: true, data: { ok: true } });
  };
});

test("concurrent 401s share one refresh and each request replays with the new token", async () => {
  const results = await Promise.all(
    Array.from({ length: 5 }, () =>
      requestData({ url: "/users/me", requiresAuth: true }),
    ),
  );
  assert.equal(results.length, 5);
  assert.equal(refreshes, 1);
  assert.equal(useAuthStore.getState().refreshToken, "new-refresh");
});

test("a late old-token 401 reuses the token already refreshed by another request", async () => {
  const gate = deferred<void>();
  api.defaults.adapter = async (config) => {
    if (config.headers.get("Authorization") === "Bearer old-access") {
      if (config.url === "/slow") await gate.promise;
      fail(config, 401);
    }
    return response(config, { success: true, data: "ok" });
  };
  const slow = requestData({ url: "/slow", requiresAuth: true });
  await requestData({ url: "/fast", requiresAuth: true });
  gate.resolve();
  assert.equal(await slow, "ok");
  assert.equal(refreshes, 1);
});

test("a POST rejected by the guard replays once with exactly the same body", async () => {
  const bodies: unknown[] = [];
  api.defaults.adapter = async (config) => {
    bodies.push(config.data);
    if (config.headers.get("Authorization") === "Bearer old-access")
      fail(config, 401);
    return response(config, { success: true, data: "added" });
  };
  assert.equal(
    await requestData({
      method: "POST",
      url: "/cart/items",
      requiresAuth: true,
      data: { variantId: "v1", quantity: 2 },
    }),
    "added",
  );
  assert.equal(bodies.length, 2);
  assert.equal(bodies[0], bodies[1]);
});

test("a second 401 stops retrying and clears the rejected session", async () => {
  let requests = 0;
  api.defaults.adapter = async (config) => {
    requests++;
    fail(config, 401);
  };
  await assert.rejects(
    requestData({ url: "/users/me", requiresAuth: true }),
    ApiClientError,
  );
  assert.equal(requests, 2);
  assert.equal(refreshes, 1);
  assert.equal(useAuthStore.getState().status, "unauthenticated");
});

for (const status of [401, 403]) {
  test(`refresh ${status} clears the session and never loops`, async () => {
    sessionHttp.defaults.adapter = async (config) => {
      refreshes++;
      fail(config, status);
    };
    await assert.rejects(
      requestData({ url: "/users/me", requiresAuth: true }),
      ApiClientError,
    );
    assert.equal(refreshes, 1);
    assert.equal(useAuthStore.getState().refreshToken, null);
  });
}

test("a refresh network failure preserves the session and a later attempt can recover", async () => {
  sessionHttp.defaults.adapter = async (config) => {
    throw new AxiosError("Offline", "ERR_NETWORK", config);
  };
  await assert.rejects(
    requestData({ url: "/users/me", requiresAuth: true }),
    ApiClientError,
  );
  assert.equal(useAuthStore.getState().refreshToken, "old-refresh");
  sessionHttp.defaults.adapter = async (config) =>
    response(config, {
      success: true,
      data: session("new-access", "new-refresh"),
    });
  await requestData({ url: "/users/me", requiresAuth: true });
  assert.equal(useAuthStore.getState().accessToken, "new-access");
});

test("public/auth 401s and protected 403s never trigger refresh", async () => {
  api.defaults.adapter = async (config) =>
    fail(config, config.url === "/admin" ? 403 : 401);
  for (const url of [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/logout",
    "/products",
  ]) {
    await assert.rejects(requestData({ url }), ApiClientError);
  }
  await assert.rejects(
    requestData({ url: "/admin", requiresAuth: true }),
    ApiClientError,
  );
  assert.equal(refreshes, 0);
  assert.equal(useAuthStore.getState().accessToken, "old-access");
});

test("startup/manual refresh calls share the same in-flight request", async () => {
  const [a, b] = await Promise.all([refreshSession(), refreshSession()]);
  assert.equal(refreshes, 1);
  assert.equal(a.accessToken, b.accessToken);
});

test("logout during refresh never resurrects the session", async () => {
  const gate = deferred<void>();
  const started = deferred<void>();
  sessionHttp.defaults.adapter = async (config) => {
    if (config.url === "/auth/logout") return response(config, undefined, 204);
    started.resolve();
    await gate.promise;
    return response(config, {
      success: true,
      data: session("new-access", "new-refresh"),
    });
  };
  const pending = refreshSession();
  await started.promise;
  await logoutSession();
  gate.resolve();
  await assert.rejects(pending, ApiClientError);
  assert.equal(useAuthStore.getState().status, "unauthenticated");
});

test("switching accounts during refresh cannot overwrite the new account or replay its request", async () => {
  const gate = deferred<void>();
  const started = deferred<void>();
  sessionHttp.defaults.adapter = async (config) => {
    if (config.url === "/auth/logout") return response(config, undefined, 204);
    started.resolve();
    await gate.promise;
    return response(config, {
      success: true,
      data: session("new-access", "new-refresh"),
    });
  };
  const pending = requestData({ url: "/cart", requiresAuth: true });
  await started.promise;
  useAuthStore.getState().setAuth(session("b-access", "b-refresh", "user-b"));
  gate.resolve();
  await assert.rejects(pending, ApiClientError);
  assert.equal(useAuthStore.getState().user?.id, "user-b");
  assert.equal(useAuthStore.getState().accessToken, "b-access");
});

test("a late successful response from an old session is not delivered to the new account", async () => {
  const gate = deferred<void>();
  const started = deferred<void>();
  api.defaults.adapter = async (config) => {
    started.resolve();
    await gate.promise;
    return response(config, { success: true, data: "private-a" });
  };
  const pending = requestData({ url: "/cart", requiresAuth: true });
  await started.promise;
  useAuthStore.getState().setAuth(session("b-access", "b-refresh", "user-b"));
  gate.resolve();
  await assert.rejects(pending, ApiClientError);
});
