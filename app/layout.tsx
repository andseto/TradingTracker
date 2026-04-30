import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradeTrack — Portfolio Dashboard",
  description: "Dark theme trading portfolio tracker",
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
