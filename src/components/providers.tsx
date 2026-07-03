"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CommandPalette } from "@/components/command-palette";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { Toaster } from "@/components/ui/toaster";
import { useAccent } from "@/lib/accent-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrateAccent = useAccent((s) => s.hydrate);
  useEffect(() => {
    hydrateAccent();
  }, [hydrateAccent]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <CommandPalette />
        <KeyboardShortcuts />
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  );
}
