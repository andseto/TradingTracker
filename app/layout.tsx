import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradeForge — Forge your Edge",
  description: "Professional trading journal & analytics",
  icons: { icon: "/anvil.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
