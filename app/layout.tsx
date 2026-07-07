import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SetoTrading — Business Dashboard",
  description: "Track payouts, eval spending, and receipts for SetoTrading",
  icons: { icon: "/favicon.svg" },
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
