"use client";

import { signOut, useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Search, Command as CommandIcon, LogOut, User } from "lucide-react";
import { useCommandPalette } from "@/components/command-palette";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AccountData {
  name: string | null;
  email: string | null;
  image: string | null;
}

export function Topbar() {
  const open = useCommandPalette((s) => s.open);
  const { data: session } = useSession();
  const { data: account } = useQuery<AccountData | null>({
    queryKey: ["account"],
    queryFn: async () => {
      const res = await fetch("/api/account");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const name =
    account?.name ?? session?.user?.name ?? "Demo Driver";
  const email =
    account?.email ?? session?.user?.email ?? "demo@garage.dev";
  const image = account?.image ?? session?.user?.image ?? null;
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[color:var(--border)] bg-asphalt/80 px-4 backdrop-blur lg:px-6">
      <button
        onClick={open}
        className="flex h-9 flex-1 items-center gap-2 rounded-md border border-[color:var(--border)] bg-asphalt-2 px-3 text-sm text-steel transition-colors hover:border-steel-dim sm:max-w-sm"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search everything…</span>
        <kbd className="hidden items-center gap-0.5 rounded bg-asphalt-3 px-1.5 py-0.5 font-mono text-[10px] text-steel sm:flex">
          <CommandIcon className="size-3" />K
        </kbd>
      </button>

      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger className="outline-none">
          <Avatar>
            {image && <AvatarImage src={image} alt={name} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="text-sm font-medium text-paper">{name}</p>
            <p className="text-xs text-steel">{email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/settings">
              <User /> Settings
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/login" })}>
            <LogOut /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
