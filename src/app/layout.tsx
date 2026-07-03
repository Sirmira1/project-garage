import type { Metadata, Viewport } from "next";
import { Inter, Archivo_Black, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { accentInitScript, normalizeAccent } from "@/lib/appearance";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const archivo = Archivo_Black({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono-jb",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Garage Build Sheet",
  description:
    "Industrial-grade build tracking for your project cars — mods, timeline, analytics, service history and more.",
};

export const viewport: Viewport = {
  themeColor: "#0B0C0E",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let serverAccent: string | null = null;
  try {
    const userId = await getCurrentUserId();
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { accentColor: true },
      });
      if (user?.accentColor) serverAccent = normalizeAccent(user.accentColor);
    }
  } catch {
    /* ignore — fall back to localStorage/default */
  }

  return (
    <html
      lang="en"
      className={`${inter.variable} ${archivo.variable} ${jetbrains.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full antialiased">
        <script
          dangerouslySetInnerHTML={{ __html: accentInitScript(serverAccent) }}
        />
        <Providers serverAccent={serverAccent}>{children}</Providers>
      </body>
    </html>
  );
}
