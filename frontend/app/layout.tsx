import "./globals.css";
import type { Metadata } from "next";
import { StoreProvider } from "../lib/store";

export const metadata: Metadata = {
  title: "Kaizen — Continuous Improvement",
  description: "Your all-in-one life OS — tasks, notes, focus, habits, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
