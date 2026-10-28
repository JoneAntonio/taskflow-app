import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToasterProvider } from "@/components/providers/toaster-provider";
import { TimezoneSync } from "@/components/providers/timezone-sync";
import { ServiceWorkerRegister } from "@/components/providers/service-worker-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "JAFLOW Nexus — o teu centro de comando",
  description:
    "JAFLOW é a aplicação de produtividade que junta tarefas, projetos, hábitos e foco num único lugar.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nexus",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#05070d" },
    { media: "(prefers-color-scheme: light)", color: "#f3f5f9" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-PT"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <ThemeProvider>
          {children}
          <ToasterProvider />
          <TimezoneSync />
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
