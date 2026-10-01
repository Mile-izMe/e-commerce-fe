"use client";

import { useEffect, useRef, useState } from "react";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "@/src/features/auth/api";
import { ApiClientError } from "@/src/shared/lib/api";
import { getStoredRefreshToken, useAuthStore } from "@/store";

function RestoreAuthSession() {
  const queryClient = useQueryClient();
  const started = useRef(false);

  useEffect(
    () =>
      useAuthStore.subscribe((session, previous) => {
        if (session.sessionVersion !== previous.sessionVersion) {
          const filters = {
            predicate: (query: { queryKey: readonly unknown[] }) =>
              query.queryKey[0] === "auth" ||
              query.queryKey[0] === "cart" ||
              query.queryKey[0] === "chat",
          };
          void queryClient.cancelQueries(filters);
          queryClient.removeQueries(filters);
        }
        if (session.user)
          queryClient.setQueryData(["auth", "me"], session.user);
      }),
    [queryClient],
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      useAuthStore.getState().clearAuth();
      return;
    }

    void authApi.refresh().catch(() => {
      if (useAuthStore.getState().status !== "restoring") return;
      useAuthStore.getState().setRestoreFailed();
    });
  }, [queryClient]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (count, error) =>
              !(
                error instanceof ApiClientError &&
                (error.statusCode === 401 || error.statusCode === 403)
              ) && count < 2,
          },
        },
        mutationCache: new MutationCache({
          onError: (error) => {
            toast.error(error.message);
          },
        }),

        queryCache: new QueryCache({
          onError: (error) => {
            toast.error(error.message);
          },
        }),
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RestoreAuthSession />
      {children}
    </QueryClientProvider>
  );
}
