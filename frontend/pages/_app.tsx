/**
 * Pages Router custom App — wraps every `/pages/*` route (the five Spaces) in
 * shared providers.
 *
 * Most pages get the "standard" shell: TopNav at the top + a padded main
 * column. Pages can opt into a FULL-SCREEN immersive shell by setting the
 * static `fullScreen` flag on their component — the Workout page does this
 * because it has its own internal navigation, animations and chrome that
 * needs to dominate the viewport.
 */
import type { AppProps } from "next/app";
import type { ComponentType } from "react";
import { StoreProvider } from "../lib/store";
import { ThemeProvider } from "../lib/theme";
import TopNav from "../components/TopNav";
import "../app/globals.css";

// Custom component type so TS knows about our static opt-in flag
type FullScreenCapable = ComponentType & { fullScreen?: boolean };

export default function App({ Component, pageProps }: AppProps) {
  const Page = Component as FullScreenCapable;

  // Full-screen pages (like /workout) bring their own chrome — skip the
  // shared TopNav and container padding so they can paint edge-to-edge.
  if (Page.fullScreen) {
    return (
      <ThemeProvider>
        <StoreProvider>
          {/* min-h-screen + no chrome — page renders its own layout */}
          <div className="min-h-screen w-full">
            <Page {...pageProps} />
          </div>
        </StoreProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <StoreProvider>
        <div className="min-h-screen flex flex-col">
          <TopNav />
          <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-8 py-6 md:py-8 animate-fade-up">
            <Component {...pageProps} />
          </main>
        </div>
      </StoreProvider>
    </ThemeProvider>
  );
}
