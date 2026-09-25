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

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      useAuthStore.getState().clearAuth();
      return;
    }

    void authApi
      .refresh(refreshToken)
      .then((session) => {
        if (useAuthStore.getState().status !== "restoring") return;
        useAuthStore.getState().setAuth(session);
        queryClient.setQueryData(["auth", "me"], session.user);
      })
      .catch((error: unknown) => {
        if (useAuthStore.getState().status !== "restoring") return;
        if (error instanceof ApiClientError && error.statusCode === 401) {
          useAuthStore.getState().clearAuth();
        } else {
          useAuthStore.getState().setRestoreFailed();
        }
      });
  }, [queryClient]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
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
