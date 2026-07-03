"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({ redirectTo: "/login" });
  };

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
    >
      <LogOut /> Sign out
    </Button>
  );
}
