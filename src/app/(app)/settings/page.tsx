import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignOutButton } from "@/components/settings/sign-out-button";
import { AccountForm } from "@/components/settings/account-form";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { Keyboard, Palette, User as UserIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userId = await getCurrentUserId();
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : null;

  const shortcuts: [string, string][] = [
    ["⌘ / Ctrl + K", "Open command palette"],
    ["G then D", "Go to Dashboard"],
    ["G then G", "Go to Garage"],
    ["G then A", "Go to Analytics"],
    ["G then S", "Go to Settings"],
    ["Esc", "Close dialogs"],
  ];

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <PageHeader title="Settings" subtitle="Manage your account and preferences." />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="size-4 text-orange" /> Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AccountForm
              initialName={user?.name ?? "Demo Driver"}
              initialEmail={user?.email ?? ""}
              hasPassword={!!user?.passwordHash}
            />
            <div className="border-t border-[color:var(--border)] pt-4">
              <SignOutButton />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="size-4 text-orange" /> Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AppearanceSettings />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="size-4 text-orange" /> Keyboard Shortcuts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {shortcuts.map(([keys, desc]) => (
              <div key={keys} className="flex items-center justify-between text-sm">
                <span className="text-steel">{desc}</span>
                <kbd className="rounded bg-asphalt-3 px-2 py-0.5 font-mono text-xs text-paper">
                  {keys}
                </kbd>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
