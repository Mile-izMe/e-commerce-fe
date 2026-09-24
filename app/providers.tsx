/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { toast } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // Handle exception for POST, PUT, DELETE (useMutation)
        mutationCache: new MutationCache({
          onError: (error: any) => {
            toast.error(error);
          },
        }),

        // for GET (useQuery)
        queryCache: new QueryCache({
          onError: (error: any) => {
            toast.error(error);
          },
        }),
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
