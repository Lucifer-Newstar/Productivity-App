import "./globals.css";
import type { Metadata } from "next";
import { StoreProvider } from "../lib/store";
import { ThemeProvider } from "../lib/theme";
import StorageErrorBanner from "../components/StorageErrorBanner";
import NotificationCenter from "../components/NotificationCenter";
import UpdateChecker from "../components/UpdateChecker";
import ProfileDock from "../components/ProfileDock";

export const metadata: Metadata = {
  title: "Kaizen — Rule Your Realm",
  description: "Kaizen: your all-in-one life OS. Conquer tasks, training, notes, and focus like an emperor.",
};

/**
 * Inline script that runs before paint to set the correct `dark` class on <html>.
 * Prevents a "flash of dark theme" for light-mode users (and vice-versa).
 * Duplicates logic from ThemeProvider but runs synchronously in <head>.
 */
const themeInitScript = `
(function(){
  try {
    var stored = localStorage.getItem("kaizen.theme");
    var prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    var theme = stored === "dark" || stored === "light" ? stored : (prefersLight ? "light" : "dark");
    if (theme === "dark") document.documentElement.classList.add("dark");
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning because ThemeProvider toggles the `dark` class on
    // <html> on mount (before React hydrates) — avoids a class-mismatch warning.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          <StoreProvider><ProfileDock><StorageErrorBanner /><UpdateChecker /><NotificationCenter />{children}</ProfileDock></StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
