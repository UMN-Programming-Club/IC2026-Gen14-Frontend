"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ApiError } from "@/lib/api-client";

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            // Sesi habis / tidak valid: kembali ke halaman login.
            if (error instanceof ApiError && error.status === 401) {
              router.replace("/login");
            }
          },
        }),
        defaultOptions: {
          queries: { staleTime: 2_000, refetchOnWindowFocus: true },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
